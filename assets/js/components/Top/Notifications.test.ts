import { mount, config } from "@vue/test-utils";
import { describe, expect, test } from "vite-plus/test";
import Notifications from "./Notifications.vue";
import type { Notification, UiLoadpoint } from "@/types/evcc";

config.global.mocks["$t"] = (key: string) => key;
config.global.mocks["$i18n"] = { locale: "en" };
config.global.stubs["router-link"] = true;

type Message = Omit<Notification, "message"> & { message: string | string[] };

const notification = (message: string | string[], source: { lp?: number; area?: string } = {}) =>
  ({ message, level: "error", time: new Date(), count: 1, lp: 0, ...source }) as Message;

const loadpoint = (id: string, displayTitle: string) => ({ id, displayTitle }) as UiLoadpoint;

const lines = (msg: Message, loadpoints: UiLoadpoint[] = []) =>
  mount(Notifications, { props: { loadpoints } }).vm.message(msg);

describe("device", () => {
  test("prefixes the log area", () => {
    expect(lines(notification("not available", { area: "gsi" }))).toEqual(["gsi: not available"]);
  });

  test("prefixes the area of a configured device with title", () => {
    expect(lines(notification("not available", { area: "db:5-Keller" }))).toEqual([
      "db:5-Keller: not available",
    ]);
  });

  test("keeps messages without source as they are", () => {
    expect(lines(notification("not available"))).toEqual(["not available"]);
  });

  test("prefixes multi-line messages only once", () => {
    const msg = notification(["first", "second"], { area: "gsi" });

    lines(msg);

    expect(lines(msg)).toEqual(["gsi: first", "second"]);
    expect(msg.message).toEqual(["first", "second"]);
  });
});

describe("loadpoint", () => {
  test("prefixes the title instead of the area", () => {
    expect(
      lines(notification("charger soc: not available", { lp: 1, area: "lp-1" }), [
        loadpoint("1", "Garage"),
      ])
    ).toEqual(["Garage: charger soc: not available"]);
  });

  test("falls back to the id without title", () => {
    expect(
      lines(notification("charge power: not available", { lp: 2 }), [loadpoint("2", "")])
    ).toEqual(["2: charge power: not available"]);
  });

  test("falls back to the id for an unknown loadpoint", () => {
    expect(
      lines(notification("charge power: not available", { lp: 3 }), [loadpoint("1", "Garage")])
    ).toEqual(["3: charge power: not available"]);
  });
});
