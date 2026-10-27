#!/usr/bin/env python3
"""Verify owned deployments with synthetic data; never print credentials or cookies.

Usage: python scripts/verify-live-backends.py --secrets-dir /private/path \
  --apps fieldbrief cultureroute crowdquest fitreceipt reloop lessonscript rhythmweave
Each private <app>.json supplies JUDGE_ACCESS_CODE, OPERATOR_ACCESS_CODE and CRON_SECRET.
Only the seven fixed production origins below receive these secrets. Redirects are refused.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import http.cookies
import json
from pathlib import Path
import urllib.error
import urllib.request
import uuid

APPS = ['fieldbrief', 'cultureroute', 'crowdquest', 'fitreceipt', 'reloop', 'lessonscript', 'rhythmweave']

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

class Client:
    def __init__(self, app):
        assert app in APPS
        self.origin = 'https://' + app + '-devpost-2026.vercel.app'
        self.cookie = None
        self.opener = urllib.request.build_opener(NoRedirect)

    def call(self, method, path, payload=None, headers=None):
        assert path.startswith('/api/') and not path.startswith('//')
        h = {'Accept': 'application/json', 'Origin': self.origin, **(headers or {})}
        if self.cookie:
            h['Cookie'] = self.cookie
        data = None
        if payload is not None:
            h['Content-Type'] = 'application/json'
            data = json.dumps(payload).encode()
        request = urllib.request.Request(self.origin + path, data=data, method=method, headers=h)
        try:
            response = self.opener.open(request, timeout=60)
        except urllib.error.HTTPError as error:
            response = error
        raw = response.read(2_000_001)
        assert len(raw) <= 2_000_000, 'Response too large'
        body = json.loads(raw)
        cookie = response.headers.get('Set-Cookie')
        if cookie:
            parsed = http.cookies.SimpleCookie(cookie)
            if 'work_session' in parsed:
                self.cookie = 'work_session=' + parsed['work_session'].value
        return response.status, body, response.headers

def verify(app, secrets):
    evidence = {'application': app, 'url': 'https://' + app + '-devpost-2026.vercel.app',
                'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'checks': [], 'sponsorIntegrationVerified': False, 'syntheticDataOnly': True}
    def check(label, condition, details=None):
        evidence['checks'].append({'check': label, 'passed': bool(condition), **({'evidence': details} if details is not None else {})})
        if not condition:
            raise AssertionError(label)
    def call(label, client, method, path, expected, payload=None, headers=None):
        status, body, response_headers = client.call(method, path, payload, headers)
        check(label, status == expected, {'status': status, 'expected': expected})
        return body, response_headers
    def login(role='judge'):
        client = Client(app)
        _, h = call(role + ' login', client, 'POST', '/api/session', 200, {'code': secrets[role.upper() + '_ACCESS_CODE']})
        cookie = h.get('Set-Cookie', '')
        check('secure session cookie', all(x in cookie.lower() for x in ['httponly', 'secure', 'samesite=strict']))
        return client
    try:
        anonymous = Client(app)
        health, _ = call('health endpoint', anonymous, 'GET', '/api/health', 200)
        evidence['health'] = health
        check('database configured', 'DATABASE_URL' not in health.get('missing', []))
        call('anonymous history denied', anonymous, 'GET', '/api/lab/runs', 401)
        call('foreign origin denied', anonymous, 'POST', '/api/session', 403, {'code': 'invalid-access-code'}, {'Origin': 'https://example.invalid'})
        call('invalid access code denied', anonymous, 'POST', '/api/session', 401, {'code': 'invalid-access-code'})
        judge = login()
        history, _ = call('authenticated database read', judge, 'GET', '/api/lab/runs', 200)
        check('new judge has isolated empty history', history.get('runs') == [])
        call('unauthorized cleanup denied', anonymous, 'GET', '/api/internal/cleanup', 401)
        cleaned, _ = call('authorized expiry cleanup', anonymous, 'GET', '/api/internal/cleanup', 200, headers={'Authorization': 'Bearer ' + secrets['CRON_SECRET']})
        check('expired fixtures removed', cleaned.get('ok') is True and all(int(cleaned['counts'][k]) >= 1 for k in ['expired_runs', 'old_limits', 'old_receipts']), cleaned.get('counts'))

        if app in ['lessonscript', 'rhythmweave']:
            other = login()
            payload = {'source': 'title "Live storage verification"\nexercise "Fractions" = 7/12 + 5/8\nexercise "Order" = 3 * (7 - 2)\nexercise "Signed" = -(3/4) + 1/2'} if app == 'lessonscript' else {'steps': 25, 'pulses': 9, 'rings': 8, 'rotation': 1, 'palette': 'moss'}
            saved, _ = call('save generated work', judge, 'POST', '/api/' + app, 200, payload)
            record_id = saved['id']
            if app == 'lessonscript':
                answers = [x['answer'] for x in saved['worksheet']['exercises']]
                check('exact arithmetic preserved', answers == ['29/24', '15', '-1/4'], answers)
            else:
                check('generated artwork matches recipe', saved['recipe'] == payload and sum(saved['beats']) == 9 and '<svg' in saved['svg'], {'description': saved['description'], 'svgSha256': hashlib.sha256(saved['svg'].encode()).hexdigest()})
            history, _ = call('read saved work', judge, 'GET', '/api/lab/runs', 200)
            check('saved record persists', any(r['id'] == record_id for r in history['runs']))
            hidden, _ = call('other judge history', other, 'GET', '/api/lab/runs', 200)
            check('cross-user record hidden', all(r['id'] != record_id for r in hidden['runs']))
            call('cross-user deletion is harmless', other, 'DELETE', '/api/lab/runs', 200, {'id': record_id})
            history, _ = call('owner record survives foreign deletion', judge, 'GET', '/api/lab/runs', 200)
            check('foreign deletion did not remove record', any(r['id'] == record_id for r in history['runs']))
            call('owner removes own test record', judge, 'DELETE', '/api/lab/runs', 200, {'id': record_id})
            history, _ = call('confirm own deletion', judge, 'GET', '/api/lab/runs', 200)
            check('own test record removed', all(r['id'] != record_id for r in history['runs']))
            evidence['productFlowVerified'] = True
        elif app == 'reloop':
            claimants = [login(), login(), login()]
            listed, _ = call('donor lists synthetic material', judge, 'POST', '/api/reloop', 201, {'title': '[TEST] Verification only; no real material ' + uuid.uuid4().hex[:6], 'material': 'paper', 'grams': 100, 'units': 2, 'district': 'Synthetic test workspace', 'days': 1})
            item_id = listed['id']
            call('self-claim blocked', judge, 'POST', '/api/reloop/claims', 409, {'itemId': item_id, 'units': 1})
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
                results = list(pool.map(lambda c: c.call('POST', '/api/reloop/claims', {'itemId': item_id, 'units': 1}), claimants))
            statuses = sorted(r[0] for r in results)
            check('concurrent claims cannot oversell two units', statuses == [201, 201, 409], statuses)
            winning = next(i for i, r in enumerate(results) if r[0] == 201)
            claim_id = results[winning][1]['id']
            call('claimant cannot confirm handover', claimants[winning], 'PATCH', '/api/reloop/claims', 409, {'id': claim_id})
            call('donor confirms handover', judge, 'PATCH', '/api/reloop/claims', 200, {'id': claim_id})
            call('duplicate confirmation blocked', judge, 'PATCH', '/api/reloop/claims', 409, {'id': claim_id})
            donor, _ = call('donor sees persisted claims', judge, 'GET', '/api/reloop', 200)
            check('donor sees exactly two claims', len(donor['claims']) == 2 and sum(c['units'] for c in donor['claims']) == 2)
            check('exhausted inventory no longer offered', all(i['id'] != item_id for i in donor['items']))
            outsider = claimants[next(i for i, r in enumerate(results) if r[0] == 409)]
            outsider_view, _ = call('unrelated judge claim view', outsider, 'GET', '/api/reloop', 200)
            check('unrelated judge cannot see claims', outsider_view['claims'] == [])
            evidence['productFlowVerified'] = True
            evidence['testFixture'] = {'itemId': item_id, 'remaining': 0, 'privateJudgeWorkspace': True, 'synthetic': True}
        else:
            requests = {
                'fieldbrief': ('/api/fieldbrief', {'question': 'What records require review?', 'evidence': [{'id': 'TEST_A', 'text': 'Synthetic pump log records a vibration observation.'}, {'id': 'TEST_B', 'text': 'Synthetic handover records no measurements.'}]}, 'NEBIUS_API_KEY'),
                'cultureroute': ('/api/cultureroute', {'signals': ['jazz'], 'city': 'Lagos', 'target': 'place'}, 'QLOO_API_KEY'),
                'fitreceipt': ('/api/fitreceipt/uploads', {'consent': True, 'name': 'synthetic-test.png', 'type': 'image/png', 'size': 100}, 'YOUCAM_API_KEY'),
                'crowdquest': ('/api/crowdquest/rounds', {'question': 'Synthetic round for configuration verification?', 'options': ['A', 'B', 'C', 'D'], 'correct': 0, 'seconds': 30}, 'TWITCH_BROADCASTER_ID')}
            path, payload, missing = requests[app]
            client = login('operator') if app == 'crowdquest' else judge
            blocked, _ = call('missing sponsor configuration fails clearly', client, 'POST', path, 503, payload)
            check('sponsor blocker accurately named', missing in blocked.get('error', ''), {'missing': missing})
            if app == 'crowdquest':
                call('judge cannot create broadcaster round', judge, 'POST', path, 403, payload)
            evidence['productFlowVerified'] = False
        call('workspace logout', judge, 'DELETE', '/api/session', 200)
        judge.cookie = None
        call('logged-out history denied', judge, 'GET', '/api/lab/runs', 401)
        evidence['passed'] = True
    except Exception as error:
        evidence['passed'] = False
        evidence['failure'] = type(error).__name__ + ': ' + str(error)[:300]
    return evidence

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--secrets-dir', required=True, type=Path)
    parser.add_argument('--apps', nargs='+', choices=APPS, default=APPS)
    parser.add_argument('--output', type=Path, default=Path('deploy/live-backend-checks.json'))
    args = parser.parse_args()
    failed = False
    for app in args.apps:
        secret = json.loads((args.secrets_dir / (app + '.json')).read_text())
        result = verify(app, secret)
        serialized = json.dumps(result)
        assert not any(str(value) in serialized for value in secret.values()), 'Sensitive value in report'
        report = json.loads(args.output.read_text()) if args.output.exists() else {'projects': {}}
        report['projects'][app] = result
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps({'app': app, 'passed': result['passed'], 'checks': len(result['checks']), 'failure': result.get('failure')}), flush=True)
        failed |= not result['passed']
    raise SystemExit(1 if failed else 0)

if __name__ == '__main__':
    main()
