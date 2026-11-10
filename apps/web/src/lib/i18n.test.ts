import { describe, expect, it } from "vitest";
import { localeDetails, locales, translate } from "./i18n";

describe("Arabic and English", () => {
  it("uses RTL Arabic and LTR English, with no Malay choice", () => {
    expect(locales).toEqual(["ar", "en"]);
    expect(localeDetails.ar.direction).toBe("rtl");
    expect(localeDetails.en.direction).toBe("ltr");
  });
  it("preserves placeholders, names and quantities", () => {
    expect(translate("ar", "Hello, {name}", {name:"أحمد"})).toBe("هلا أحمد");
    expect(translate("ar", "Decrease {name}", {name:"عسل كلولوت"})).toBe("تقليل كمية عسل كلولوت");
    expect(translate("en", "Hello, {name}", {name:"Ahmad"})).toBe("Hello, Ahmad");
  });
});
