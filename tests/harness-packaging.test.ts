import {describe,it,expect} from "vitest";
import {runQlooExec} from "@qloo/qloo-harness";
describe("Qloo installed workflow entry point",()=>{
 it("loads the real official exec workflow without a model or API key",async()=>{
  let output="";const result=await runQlooExec(["--help"],{env:{NODE_ENV:"test"},writeOut:text=>{output+=text;},writeError:()=>{}});
  expect(result).toBe(0);expect(output).toContain("Execute one validated Qloo workflow");expect(output).toContain("recommend");
 });
});
