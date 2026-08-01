import { describe, expect, it } from "vitest";
import { formatLandingTime, greetingForHour } from "./landing-personalization";
describe("landing personalization",()=>{it.each([[5,"Dobro jutro"],[11,"Dobro jutro"],[12,"Dobar dan"],[17,"Dobar dan"],[18,"Dobro veče"],[22,"Dobro veče"],[23,"Dobro došli"],[4,"Dobro došli"]])("sat %i",(hour,result)=>expect(greetingForHour(hour)).toBe(result));it("formatira vrijeme sa sekundama",()=>expect(formatLandingTime(new Date("2026-08-01T14:37:18"),"hr-HR")).toMatch(/14:37:18/));});
