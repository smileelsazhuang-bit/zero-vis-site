(function (root, factory) {
  "use strict";

  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root && typeof root === "object") {
    root.WeatherSimulator = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ALL_CARDS = ["sun", "rain", "wind", "snow", "thunder", "fog"];
  var SUMMER_CARDS = ["sun", "rain", "wind", "thunder", "fog"];
  var WINTER_CARDS = ["sun", "rain", "wind", "snow", "thunder"];

  function clone(value) {
    var result;
    var key;
    var index;

    if (Array.isArray(value)) {
      result = [];
      for (index = 0; index < value.length; index += 1) {
        result.push(clone(value[index]));
      }
      return result;
    }

    if (value && typeof value === "object") {
      result = {};
      for (key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = clone(value[key]);
        }
      }
      return result;
    }

    return value;
  }

  function freezeDeep(value) {
    var keys;
    var index;

    if (!value || (typeof value !== "object" && typeof value !== "function") || Object.isFrozen(value)) {
      return value;
    }

    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      freezeDeep(value[keys[index]]);
    }
    return Object.freeze(value);
  }

  function transitionResult(state, events, failKey) {
    return {
      state: state,
      events: events || [],
      failKey: failKey || null
    };
  }

  function finalResult(state, success, failKey, events) {
    return {
      state: state,
      success: Boolean(success),
      failKey: failKey || null,
      events: events || []
    };
  }

  var LEVEL_RULES = {
    "1-1": {
      id: "1-1",
      slots: ["明天"],
      cards: ["sun", "rain"],
      initialState: { flowers: "closed" },
      solution: ["sun"],
      failureKeys: ["rain"],
      transition: function (state, card) {
        var next = clone(state);

        if (card === "sun") {
          next.flowers = "open";
        }

        return transitionResult(next, [card]);
      },
      finalize: function (state) {
        var next = clone(state);
        return next.flowers === "open"
          ? finalResult(next, true, null)
          : finalResult(next, false, "rain");
      }
    },

    "1-2": {
      id: "1-2",
      slots: ["上午", "下午"],
      cards: ["sun", "rain", "wind", "snow"],
      initialState: { pond: "water", kite: "tree", kiteWet: false },
      solution: ["snow", "wind"],
      failureKeys: ["kite_water", "kite_stuck"],
      transition: function (state, card) {
        var next = clone(state);
        var events = [];

        if (card === "snow") {
          next.pond = "ice";
          events.push("snow");
        } else if (card === "sun") {
          next.pond = "water";
          next.kiteWet = false;
          events.push("sun");
        } else if (card === "rain") {
          next.kiteWet = true;
          events.push("rain");
        } else if (card === "wind" && next.kite === "tree") {
          if (next.kiteWet) {
            events.push("wind_wet");
          } else {
            events.push("wind_fall");
            if (next.pond === "ice") {
              next.kite = "ice";
              events.push("kite_on_ice");
            } else {
              next.kite = "water";
              events.push("kite_in_water");
              return transitionResult(next, events, "kite_water");
            }
          }
        } else {
          events.push(card);
        }

        return transitionResult(next, events);
      },
      finalize: function (state) {
        var next = clone(state);
        if (next.kite === "ice") {
          return finalResult(next, true, null);
        }
        return finalResult(next, false, next.kite === "water" ? "kite_water" : "kite_stuck");
      }
    },

    "1-3": {
      id: "1-3",
      slots: ["傍晚", "夜里"],
      cards: ALL_CARDS.slice(),
      initialState: { fog: true, lamp: false, boat: "sea" },
      solution: ["thunder", "wind"],
      failureKeys: ["lost_dark", "fog_remains", "no_light"],
      transition: function (state, card) {
        var next = clone(state);
        var events = [];

        if (card === "thunder") {
          next.lamp = true;
          events.push("thunder");
        } else if (card === "wind") {
          next.fog = false;
          events.push("wind_clear");
          if (next.boat === "sea") {
            if (next.lamp) {
              next.boat = "home";
              events.push("boat_home");
            } else {
              events.push("boat_lost");
              return transitionResult(next, events, "lost_dark");
            }
          }
        } else if (card === "fog") {
          next.fog = true;
          events.push("fog");
        } else {
          events.push(card);
        }

        return transitionResult(next, events);
      },
      finalize: function (state) {
        var next = clone(state);
        if (next.boat === "home") {
          return finalResult(next, true, null);
        }
        if (next.lamp && next.fog) {
          return finalResult(next, false, "fog_remains");
        }
        return finalResult(next, false, "no_light");
      }
    },

    "2-1": {
      id: "2-1",
      slots: ["上午", "下午"],
      cards: ALL_CARDS.slice(),
      initialState: { barrel: "empty", sold: false },
      solution: ["thunder", "sun"],
      failureKeys: ["no_ice", "cloudy_no_customers"],
      transition: function (state, card, context) {
        var next = clone(state);
        var eventName = card;

        if (card === "rain" || card === "snow") {
          if (next.barrel === "empty") {
            next.barrel = "water";
          }
          eventName = card === "snow" ? "snow_melt" : "rain";
        } else if (card === "thunder") {
          next.barrel = "ice";
          eventName = "thunder_hail";
        } else if (card === "wind") {
          eventName = "wind";
        } else if (card === "sun") {
          if (context && context.index === 0) {
            eventName = "sun_morning";
          } else if (next.barrel === "ice") {
            next.sold = true;
            eventName = "sun_sell";
          } else {
            eventName = "sun_noice";
          }
        } else if (card === "fog") {
          eventName = "fog";
        }

        return transitionResult(next, [eventName]);
      },
      finalize: function (state) {
        var next = clone(state);
        if (next.sold) {
          return finalResult(next, true, null);
        }
        return finalResult(next, false, next.barrel === "ice" ? "cloudy_no_customers" : "no_ice");
      }
    },

    "2-2": {
      id: "2-2",
      slots: ["上午", "中午", "傍晚"],
      cards: SUMMER_CARDS.slice(),
      initialState: { clouds: true, rainedBefore: false, rainbow: false },
      solution: ["rain", "wind", "sun"],
      failureKeys: ["no_rainbow"],
      transition: function (state, card) {
        var next = clone(state);
        var eventName = card;

        if (card === "rain") {
          next.clouds = true;
          next.rainedBefore = true;
        } else if (card === "wind") {
          next.clouds = false;
        } else if (card === "sun") {
          if (next.clouds) {
            eventName = "sun_cloudy";
          } else if (next.rainedBefore) {
            next.rainbow = true;
            eventName = "sun_rainbow";
          } else {
            eventName = "sun_plain";
          }
        }

        return transitionResult(next, [eventName]);
      },
      finalize: function (state) {
        var next = clone(state);
        return next.rainbow
          ? finalResult(next, true, null)
          : finalResult(next, false, "no_rainbow");
      }
    },

    "2-3": {
      id: "2-3",
      slots: ["天黑后", "开场时"],
      cards: SUMMER_CARDS.slice(),
      initialState: { power: false, fogScreen: false },
      solution: ["thunder", "fog"],
      alternateSolutions: [["fog", "thunder"]],
      failureKeys: ["rain_audience", "no_power", "no_screen"],
      transition: function (state, card) {
        var next = clone(state);
        var eventName = card;

        if (card === "thunder") {
          next.power = true;
        } else if (card === "fog") {
          next.fogScreen = true;
        } else if (card === "wind") {
          eventName = next.fogScreen ? "wind_fog" : "wind";
          next.fogScreen = false;
        } else if (card === "rain") {
          return transitionResult(next, ["rain"], "rain_audience");
        }

        return transitionResult(next, [eventName]);
      },
      finalize: function (state) {
        var next = clone(state);
        if (next.power && next.fogScreen) {
          return finalResult(next, true, null);
        }
        if (!next.power) {
          return finalResult(next, false, "no_power");
        }
        return finalResult(next, false, "no_screen");
      }
    },

    "3-1": {
      id: "3-1",
      slots: ["白天", "傍晚"],
      cards: WINTER_CARDS.slice(),
      initialState: { fog: true, snowOnFlowers: true, flowers: "closed" },
      solution: ["wind", "sun"],
      failureKeys: ["still_fog", "flowers_closed"],
      transition: function (state, card) {
        var next = clone(state);
        var eventName = card;

        if (card === "wind") {
          var hadFog = next.fog;
          next.fog = false;
          if (!hadFog) {
            return transitionResult(next, []);
          }
          eventName = "wind";
        } else if (card === "sun") {
          next.snowOnFlowers = false;
          next.flowers = "open";
          eventName = next.fog ? "sun_fog" : "sun";
        } else if (next.fog) {
          eventName = "fog_block";
        }

        return transitionResult(next, [eventName]);
      },
      finalize: function (state, sequence) {
        var next = clone(state);
        var events = [];

        if (sequence[sequence.length - 1] !== "sun") {
          if (next.flowers === "open") {
            events.push("evening_close");
          }
          next.flowers = "closed";
        }

        if (!next.fog && next.flowers === "open") {
          return finalResult(next, true, null, events);
        }
        if (next.fog) {
          return finalResult(next, false, "still_fog", events);
        }
        return finalResult(next, false, "flowers_closed", events);
      }
    },

    "3-2": {
      id: "3-2",
      slots: ["傍晚", "夜里"],
      cards: WINTER_CARDS.slice(),
      initialState: { fog: true, ice: "thin", elderHome: false, kiteRaised: false },
      solution: ["snow", "wind"],
      failureKeys: ["ice_melt", "thin_ice", "lost"],
      transition: function (state, card) {
        var next = clone(state);

        if (card === "snow") {
          next.ice = "thick";
          return transitionResult(next, ["snow"]);
        }

        if (card === "sun") {
          return transitionResult(next, ["sun"], "ice_melt");
        }

        if (card === "wind") {
          next.fog = false;
          next.kiteRaised = true;
          if (next.ice === "thick") {
            next.elderHome = true;
            return transitionResult(next, ["wind_safe"]);
          }
          return transitionResult(next, ["wind_thin"], "thin_ice");
        }

        return transitionResult(next, [card]);
      },
      finalize: function (state) {
        var next = clone(state);
        return next.elderHome
          ? finalResult(next, true, null)
          : finalResult(next, false, "lost");
      }
    },

    "3-3": {
      id: "3-3",
      slots: ["傍晚", "深夜", "凌晨", "清晨"],
      cards: WINTER_CARDS.slice(),
      initialState: { fog: true, snowCount: 0, sunrise: false },
      solution: ["wind", "snow", "snow", "sun"],
      failureKeys: ["fog_first", "snow_all_night", "morning_sun"],
      transition: function (state, card, context) {
        var next = clone(state);
        var eventName = card;

        if (next.fog) {
          if (card === "wind") {
            next.fog = false;
            return transitionResult(next, ["wind"]);
          }
          return transitionResult(next, ["fog_block"]);
        }

        if (card === "wind") {
          return transitionResult(next, []);
        }

        if (card === "snow") {
          next.snowCount += 1;
          eventName = next.snowCount > 1 ? "snow_night" : "snow";
        } else if (card === "sun" && context.index === context.sequence.length - 1) {
          next.sunrise = true;
          eventName = "sun_morning";
        }

        return transitionResult(next, [eventName]);
      },
      finalize: function (state, sequence) {
        var next = clone(state);

        if (sequence[0] !== "wind") {
          return finalResult(next, false, "fog_first");
        }
        if (sequence[1] !== "snow" || sequence[2] !== "snow") {
          return finalResult(next, false, "snow_all_night");
        }
        if (sequence[3] !== "sun") {
          return finalResult(next, false, "morning_sun");
        }
        return finalResult(next, true, null);
      }
    }
  };

  freezeDeep(LEVEL_RULES);

  function getRule(levelId) {
    if (typeof levelId !== "string" || !Object.prototype.hasOwnProperty.call(LEVEL_RULES, levelId)) {
      throw new Error("Unknown level: " + String(levelId));
    }
    return LEVEL_RULES[levelId];
  }

  function getInitialState(levelId) {
    return clone(getRule(levelId).initialState);
  }

  function validateSequence(rule, sequence) {
    var index;
    var card;

    if (!Array.isArray(sequence)) {
      throw new Error("Sequence for level " + rule.id + " must be an array");
    }
    if (sequence.length !== rule.slots.length) {
      throw new Error(
        "Level " + rule.id + " needs " + rule.slots.length + " cards, received " + sequence.length
      );
    }

    for (index = 0; index < sequence.length; index += 1) {
      card = sequence[index];
      if (typeof card !== "string" || rule.cards.indexOf(card) === -1) {
        throw new Error("Illegal card at slot " + index + " for level " + rule.id + ": " + String(card));
      }
    }
  }

  function simulateLevel(levelId, sequence) {
    var rule = getRule(levelId);
    var input;
    var state;
    var steps = [];
    var finalEvents = [];
    var success = false;
    var failKey = null;
    var immediate = false;
    var index;
    var outcome;
    var final;

    validateSequence(rule, sequence);
    input = sequence.slice();
    state = getInitialState(levelId);

    for (index = 0; index < input.length; index += 1) {
      outcome = rule.transition(state, input[index], {
        levelId: levelId,
        index: index,
        slot: rule.slots[index],
        sequence: input.slice()
      });

      state = clone(outcome.state);
      steps.push({
        index: index,
        slot: rule.slots[index],
        card: input[index],
        events: (outcome.events || []).slice(),
        state: clone(state),
        failKey: outcome.failKey || null,
        immediate: Boolean(outcome.failKey)
      });

      if (outcome.failKey) {
        failKey = outcome.failKey;
        immediate = true;
        break;
      }
    }

    if (!immediate) {
      final = rule.finalize(state, input.slice());
      state = clone(final.state);
      success = Boolean(final.success);
      failKey = final.failKey || null;
      finalEvents = (final.events || []).slice();
    }

    return {
      levelId: levelId,
      sequence: input,
      success: success,
      failKey: failKey,
      immediate: immediate,
      endedEarly: immediate,
      state: clone(state),
      steps: steps,
      finalEvents: finalEvents
    };
  }

  return freezeDeep({
    LEVEL_RULES: LEVEL_RULES,
    simulateLevel: simulateLevel,
    getInitialState: getInitialState
  });
});
