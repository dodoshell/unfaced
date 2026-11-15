import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { libraryBrowserPath } from "../../engine/src/render/browser.js";
import { LIBRARY_ROOT } from "../../engine/src/paths.js";

describe("libraryBrowserPath", () => {
  const shell = (name: string) => join("/lib", "node_modules", ".remotion", "chrome-headless-shell", name, `chrome-headless-shell-${name}`);

  it("points at the library's browser, never at the working directory", () => {
    expect(libraryBrowserPath().startsWith(join(LIBRARY_ROOT, "node_modules", ".remotion"))).toBe(true);
  });

  it.each([
    ["win32", "x64", join(shell("win64"), "chrome-headless-shell.exe")],
    ["darwin", "arm64", join(shell("mac-arm64"), "chrome-headless-shell")],
    ["darwin", "x64", join(shell("mac-x64"), "chrome-headless-shell")],
    ["linux", "x64", join(shell("linux64"), "chrome-headless-shell")],
    ["linux", "arm64", join(shell("linux-arm64"), "chrome-headless-shell")],
  ] as const)("uses Remotion's folder names on %s %s", (platform, arch, expected) => {
    expect(libraryBrowserPath("/lib", platform, arch)).toBe(expected);
  });
});
