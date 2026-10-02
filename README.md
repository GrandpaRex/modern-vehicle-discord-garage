# Modern Garage — Discord Role‑Based Vehicle Garage with Showcase

**Video demonstration:** https://www.youtube.com/watch?v=go4ze5zZGZg

A FiveM vehicle garage gated by Discord roles. Players walk up to a garage point, browse vehicles grouped into divisions, preview them on a rotating pedestal with a scripted camera, optionally customize them, and spawn them at a free spawn point. Access, vehicle choice, customization, plates and spawn position are all decided and validated on the server.

## Features
- Discord role–gated garages and vehicles, checked on the server, with optional bypass roles
- Divisions (collapsible sub‑menus, e.g. Patrol / Traffic), shown only when the player can use at least one vehicle in them
- Multiple interaction points (stations) per garage, each with its own spawn and delete points, and per‑station vehicle availability
- 3D preview on a fixed pedestal with a scripted camera and slow rotation
- Emergency light toggle on the preview (emergency‑class vehicles only)
- Configured vehicle appearance: livery, extras, mods, colors, window tint, dirt
- Optional player‑selectable liveries, colors, extras and mods with live preview, limited to a per‑vehicle whitelist
- Server‑generated plates with a global or per‑vehicle format
- Spawn availability checks; the Spawn button is disabled when every spawn point is occupied
- Delete points for returning vehicles
- Player isolation in a routing bucket while the menu is open
- Server events for integrating with fuel, keys, MDT or persistence scripts

---

## Requirements
- **OneSync** enabled (the server tracks and deletes vehicles itself).
- **`night_discordapi`**, configured so that `exports.night_discordapi:GetDiscordMemberRoles(source)` returns the player's roles as an array.

## Installation
1. Place the resource folder in your server's `resources` directory.
2. In `server.cfg`, start the Discord API first:
   ```
   ensure night_discordapi
   ensure modern_garage
   ```
   Use whatever name you gave the resource folder.
3. Edit `config.lua` (see below) and restart the resource.

---

## Configuration (`config.lua`)

### Roles
Every role value in the config (`Config.BypassRoles`, a garage's `allowedRoles`, a vehicle's `roles`) is compared, as a string, with the values `GetDiscordMemberRoles` returns. Use exactly the format your `night_discordapi` setup returns, usually Discord role IDs such as `"112233445566778899"`. The role names used in the examples are placeholders.

Any role field accepts a single value, an array, or nothing. Empty or missing means "no restriction".

### General options

| Option | Default | Description |
|---|---|---|
| `Config.BypassRoles` | `{}` | Players with any of these roles pass every garage and vehicle role check. Station restrictions still apply. |
| `Config.PlateFormat` | `'random'` | Plate format for all vehicles. See [Plates](#plates). |
| `Config.InteractionRange` | `5.0` | Max distance from the interaction point at which the server accepts open and spawn requests. |
| `Config.MenuBucketBase` | `50000` | While the menu is open, the player is in routing bucket `MenuBucketBase + serverId`. Pick a base that doesn't overlap buckets used by other resources. |
| `Config.DeleteOnlyGarageVehicles` | `true` | Delete points only remove vehicles spawned by this garage. Set `false` to allow deleting any vehicle. |

### Plates
- `'random'`: 8 random characters from A–Z and 0–9.
- A pattern of up to 8 characters: `L` = random letter, `N` = random digit (either case), any other character = space. Patterns shorter than 8 are padded with spaces.
  ```lua
  Config.PlateFormat = 'LLLNNNN'   -- e.g. "ABC1234 " (one trailing space)
  Config.PlateFormat = 'LL NN LL'  -- e.g. "AB 12 CD"
  ```
- A vehicle's `plateFormat` overrides the global format for that vehicle (including `'random'`).

### Showcase
`Config.Showcase` controls the preview pedestal:

| Field | Description |
|---|---|
| `coords` (vector4) | Where the preview vehicle is created (x, y, z, heading). |
| `rotationSpeed` (number) | Degrees the preview turns per frame, e.g. `0.05`. |
| `camOffset` (vector3) | Camera position relative to `coords`, rotated by the showcase heading. Default `vector3(3.0, 3.0, 1.5)`. |
| `camFov` (number) | Camera field of view. Default `60.0`. |

### Garages
`Config.Garages` is an array of garages.

**Garage**

| Field | Description |
|---|---|
| `name` | Menu header. Shown as `name — station` when the interaction has a station. |
| `allowedRoles` | Roles allowed to open the garage. |
| `interactions` | Array of interaction points (below). |
| `divisions` | Array of divisions (below). |
| `vehicles` | Legacy: a flat vehicle list, used only when `divisions` is absent. It is shown as one "Vehicles" division. Prefer `divisions`. |

**Interaction** (one per station / location)

| Field | Description |
|---|---|
| `coords` (vector3) | Where players open the menu: on foot, within 2.0 units, press **E**. |
| `station` (string, optional) | Station identifier used by vehicle `stations` restrictions. |
| `spawns` (vector4[]) | Spawn points for vehicles taken from this interaction. |
| `deletes` (vector3[], optional) | Delete points. |

**Division**

| Field | Description |
|---|---|
| `label` | Division name. |
| `vehicles` | Array of vehicles (below). |

**Vehicle**

| Field | Description |
|---|---|
| `model` | Spawn name, e.g. `police3`. The same model may appear more than once with different settings. |
| `name` | Name shown in the menu (defaults to `model`). |
| `roles` | Roles required for this vehicle, in addition to the garage's `allowedRoles`. |
| `stations` | Station identifiers where this vehicle is offered. Empty = every station. Ignored at interactions without a `station`. |
| `plateFormat` | Per‑vehicle plate format. |
| `livery`, `extras`, `mods`, colors, `windowTint`, `dirtLevel` | Default appearance (below). |
| `options` | Player‑selectable customization (below). |

### Vehicle appearance
All fields are optional. A field that isn't set leaves the game's default for that model.

- **`livery`**: livery index, applied when the model has that many liveries (`SetVehicleLivery`).
- **`extras`**: which extras (0–12) are on. When set, every other extra is turned off.
  - Array form: `{ 4, 8, 9 }`, the extras to enable.
  - Map form: `{ [1] = true, [2] = false }`. Values must be booleans.
- **`mods`**: mod type → mod index.
  - Map form: `{ [11] = 2, [12] = 1 }`
  - Array form: `{ { type = 11, index = 2 } }`
  - Mod types 0–49 are accepted. Common ones: 11 engine, 12 brakes, 13 transmission, 15 suspension, 16 armor, 48 livery (some add‑on vehicles). Toggle mods (17–22: turbo, xenon lights, tire smoke…) are not supported.
- **`primaryColor`, `secondaryColor`, `pearlescentColor`, `wheelColor`**: GTA palette indices 0–160. If only one of a pair (primary/secondary, pearlescent/wheel) is set, the other keeps the model's value.
- **`windowTint`**: 0–6 (0 none, 1 pure black, 2 dark smoke, 3 light smoke, 4 stock, 5 limo, 6 green).
- **`dirtLevel`**: 0.0 (clean) to 15.0 (dirty).

Out‑of‑range numbers are clamped or ignored.

### Player‑selectable customization (`options`)
Give a vehicle an `options` table to show a **Customize** panel when players preview it. The appearance fields above are the defaults; `options` is a whitelist of what players may change. The server checks every pick again at spawn, and anything not on the whitelist is ignored (the default is kept).

Each list is either `"all"` (everything the model supports) or an array of ids. An id can be a number or `{ id = number, label = "Shown name" }` to set the name shown in the panel.

```lua
options = {
    liveries = "all",                       -- or { 0, 2, { id = 3, label = "Slicktop" } }
    colors = {                              -- any of: primary, secondary, pearlescent, wheel
        primary   = { { id = 0, label = "Black" }, { id = 134, label = "White" } },
        secondary = "all"                   -- every palette color, shown as "Color N"
    },
    extras = { 1, 2, 3 },                   -- extras players may switch on/off; or "all"
    mods = {                                -- mod type => "all" or array of mod indices
        [11] = { 0, 1, 2 },                 -- engine upgrades
        [48] = "all"                        -- livery mod slot used by some add-on vehicles
    }
}
```

- The panel only lists what the model actually has: existing extras, liveries and mod indices within range. Liveries and mods use the game's names where the model provides them.
- Every selectable mod type also offers **Stock** (mod removed).
- Liveries here use `SetVehicleLivery`. For add‑on vehicles that keep liveries in mod slot 48, use `mods = { [48] = ... }` instead.
- With `options.extras` set, the vehicle's extras are strict: only extras that are on by default (the vehicle's `extras` field) or switched on by the player are enabled.
- Colors have no in‑game names, so give `label`s to any color players will see.
- `true` also works in place of `"all"`.
- Choices are not remembered between spawns.

### Example
```lua
Config.Garages = {
    {
        name = "LSPD Vehicles",
        allowedRoles = { "LSPD" },
        interactions = {
            {
                station = "MissionRow",
                coords = vector3(441.0, -982.0, 30.0),
                deletes = { vector3(407.8673, -1003.6677, 29.2662) },
                spawns = {
                    vector4(408.55, -980.61, 29.27, 47.31),
                    vector4(407.6514, -984.3986, 29.2660, 52.9018)
                }
            },
            {
                station = "DelPerro",
                coords = vector3(-1066.1061, -849.3706, 5.0417),
                deletes = { vector3(-1070.7610, -854.0753, 4.8671) },
                spawns = { vector4(-1039.6621, -855.7144, 4.8765, 51.3608) }
            }
        },
        divisions = {
            {
                label = "Patrol",
                vehicles = {
                    {
                        model = "nn21hoe",
                        name = "2021 Tahoe",
                        roles = { "LSPD Officer", "LSPD Supervisor" },
                        livery = 0,
                        extras = { 4, 8, 9, 11 },
                        mods = { [11] = 2, [12] = 1, [13] = 1 },
                        primaryColor = 0,
                        secondaryColor = 0,
                        windowTint = 0,
                        options = {
                            liveries = "all",
                            colors = { primary = { { id = 0, label = "Black" }, { id = 134, label = "White" } } },
                            extras = { 1, 2, 3 }
                        }
                    },
                    {
                        model = "nn25fpiu",
                        name = "2025 FPIU",
                        roles = { "LSPD Supervisor" },
                        stations = { "MissionRow" },   -- only offered at Mission Row
                        plateFormat = 'LLLNNNN'
                    }
                }
            },
            {
                label = "Traffic",
                vehicles = {
                    { model = "police3", name = "Traffic Interceptor", livery = 2, windowTint = 2 }
                }
            }
        }
    }
}
```

---

## How it works

### In game
1. Walk up to an interaction point on foot. A marker appears within 2.0 units; press **E**.
2. The server checks your roles and distance, moves you to an isolated routing bucket, and sends the vehicles you can use at this station.
3. The menu opens on the left. Expand a division and click a vehicle to preview it on the pedestal.
   - **Lights** toggles the preview's emergency lights (sirens muted). It is only enabled for emergency‑class (class 18) vehicles.
   - If the vehicle has `options`, the **Customize** panel appears on the right. Changes show on the preview immediately.
4. **Spawn** is enabled while a vehicle is selected and a spawn point is free. Pressing it fades the screen out and closes the menu. The server returns you to your previous routing bucket, validates the request, picks a free spawn point, and you are placed in the driver's seat.
5. **Close** (there is no Escape shortcut) leaves the menu and returns you to your previous routing bucket.

If a spawn is refused (no free spawn point, missing role, too far away, or the model can't be loaded), you get a notification and the screen fades back in.

### Spawning
- The server picks the first spawn point of the interaction with no vehicle within 2.5 units in the player's routing bucket, and reserves it for 8 seconds so simultaneous spawns don't collide.
- While the menu is open, the client asks the server for availability every second to update the Spawn button and the "spawn points full" warning.
- The model, customization, plate and position come from the server. The client creates the vehicle entity, which is normal for FiveM.

### Deleting
- Red markers show at an interaction's delete points when you are within 3.0 units. Within 2.0 units as the driver, a prompt appears: press **E** to delete.
- The server deletes the vehicle after checking that:
  - the requester is the driver,
  - the vehicle is within 3.0 units of a delete point (any garage's),
  - it was spawned by this garage (unless `Config.DeleteOnlyGarageVehicles = false`).

### Routing buckets
- Opening the menu records the player's current bucket and moves them to `Config.MenuBucketBase + serverId`.
- Closing, spawning or stopping the resource moves them back to the recorded bucket.
- Only players with an open menu can be moved back, so the event can't be used to escape buckets set by other resources.

### Security
- Garage access, vehicle roles, station restrictions and distance are checked on the server, both when the menu opens and again at spawn.
- The server keeps track of which garage and interaction each player has open. Spawn and availability requests use that, not IDs sent by the client.
- Player customization is validated against the vehicle's `options` whitelist by the same code (`customization.lua`) that the client uses for the preview, so the preview matches what spawns.
- These checks secure the garage itself. They don't stop cheat menus that spawn vehicles directly; that requires server‑wide entity protection.

---

## Integrating with other resources

The garage fires two server events you can use to connect fuel, keys, MDT, or persistence scripts.

| Event | Arguments | When |
|---|---|---|
| `moderngarage:spawned` | `netId`, `plate`, `source` | After a player's spawned vehicle has reached the server. |
| `moderngarage:deleted` | `netId`, `plate`, `source` | When a player deletes a vehicle at a delete point, just **before** it is deleted. |

Listen with `AddEventHandler` in a **server** script:

```lua
AddEventHandler('moderngarage:spawned', function(netId, plate, src)
    local veh = NetworkGetEntityFromNetworkId(netId)
    -- e.g. give keys to src, set fuel, register the plate with your MDT
end)

AddEventHandler('moderngarage:deleted', function(netId, plate, src)
    local veh = NetworkGetEntityFromNetworkId(netId) -- still exists at this point
    -- e.g. save state, remove keys
end)
```

Notes:
- **Don't** register these events with `RegisterNetEvent` anywhere. That would let clients fire fake ones.
- `spawned` fires up to about 3 seconds after the vehicle appears, once the server can see the entity. It only fires if the reported plate was issued to that player and the player still owns the entity. In rare cases (the vehicle changes owner first, or never replicates) it doesn't fire at all, so don't depend on it for anything that must always happen.
- `deleted` only fires for deletes at a garage delete point, not for vehicles removed in other ways.
- `plate` is the 8‑character plate generated by the garage, including padding spaces. Trim it if your other scripts store plates trimmed. If `Config.DeleteOnlyGarageVehicles = false` and a non‑garage vehicle is deleted, `plate` is that vehicle's own plate text.

---

## Troubleshooting

**"You are not authorized" / no vehicles in the menu**
- Check that `night_discordapi` is running and returns roles for the player.
- Check that `allowedRoles` and vehicle `roles` use the exact format it returns (usually role IDs).
- With station restrictions, check that the interaction has the intended `station` and the vehicle's `stations` includes it.

**Nothing happens when pressing E**
- Stand on foot within 2.0 units of the interaction `coords`. The server also requires you to be within `Config.InteractionRange`.

**"Invalid vehicle model for preview" / "Vehicle model could not be loaded"**
- The model isn't streamed on the server or the spawn name is wrong.

**Spawn button is greyed out**
- Every spawn point is occupied (a warning is shown), or the interaction has no `spawns`.

**No Customize panel**
- The vehicle has no `options`, or none of the whitelisted entries exist on that model (e.g. listed extras the model doesn't have).

**Can't delete a vehicle**
- You must be the driver, and by default only vehicles spawned by this garage can be deleted (`Config.DeleteOnlyGarageVehicles`).

**Lights button disabled**
- Only emergency‑class (class 18) vehicles support the preview light toggle.

**Plates look odd**
- Check `Config.PlateFormat` and the vehicle's `plateFormat`. Patterns are padded to 8 characters, and anything other than `L`/`N` becomes a space.

---

## Changelog

### 2.0.0
**Breaking changes — read before upgrading from 1.x**
- **OneSync is required.**
- **Delete points only remove vehicles spawned by this garage.** Set `Config.DeleteOnlyGarageVehicles = false` for the old behavior.
- **The menu bucket is now `Config.MenuBucketBase + serverId`** (default base `50000`) instead of the server id. Players return to the bucket they came from instead of always bucket 0.
- **`moderngarage:spawned`** now fires only after the server has verified the vehicle, up to ~3s after it appears.
- **`moderngarage:deleted`** now fires on the server just before the vehicle is deleted (previously after the client deleted it), so the entity is still readable.

**New**
- Player‑selectable liveries, colors, extras and mods per vehicle (`options`), with live preview and server‑side validation.
- `Config.InteractionRange`, `Config.MenuBucketBase`, `Config.DeleteOnlyGarageVehicles`.

**Fixes**
- The screen no longer stays black when a spawn is refused for reasons other than full spawn points, or when a model can't be loaded.
- Extras map form (`{ [1] = true, ... }`) and mods map forms containing mod type 1 now work.
- Two players spawning at the same moment no longer get the same spawn point.
- Clicking through vehicles quickly no longer leaves stray preview vehicles.
- Security: the server now checks distance and its own record of the open garage, the close event can no longer be used to leave other resources' routing buckets, and the spawn/delete events can no longer be faked by clients.
- Lower idle CPU use when away from garage points.

### 1.0.0
- Initial release.

---

## Version and credits
- Version: 2.0.0
- Author: Grandpa_Rex
