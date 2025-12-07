### Developer Documentation — Discord Role Based Garage with Showcase

#### Overview
This resource provides a secure, Discord role–gated vehicle garage with a 3D showcase and scripted camera. It supports per‑garage interactions and spawn/delete points, vehicle divisions (sub‑menus), per‑vehicle role restrictions, per‑station vehicle availability, and rich vehicle customization (livery, extras, mods, colors, tint, dirt). Plates are generated server‑side with a global or per‑vehicle format.

#### Key Features
- Discord role–gated garage access (server‑side enforcement)
- Divisions (accordion sub‑menus) like Patrol/Traffic
- Per‑vehicle role gates and per‑station availability
- 3D preview at a fixed pedestal with scripted camera and slow rotation
- Preview Lights toggle for emergency vehicles (class 18) only
- Dedicated Spawn button; UI closes on spawn
- Spawn availability checks; disables spawn if all points are full
- Screen fade transitions; delayed fade‑in after seated in spawned vehicle
- Player isolation via routing buckets while menu is open
- Vehicle delete zones with on‑screen hint and deletion event
- Secure server‑authorized spawn with server-selected spawn slot
- Configurable vehicle appearance and behavior

---

### Installation
1. Place this resource folder in your FiveM server’s `resources` directory.
2. Ensure `night_discordapi` is installed and configured to return member roles for your players.
3. In your `server.cfg`, start the resources in order:
   ```
   ensure night_discordapi
   ensure garage
   ```
---

### Configuration Reference (`config.lua`)

#### Global Plate Format
- `Config.PlateFormat` (string):
  - `'random'` (default): 8 random alphanumeric characters
  - Pattern up to 8 chars: `L` = letter A–Z, `N` = digit 0–9, any other char is a space. Shorter patterns are space‑padded to 8.
  - Examples:
    ```lua
    Config.PlateFormat = 'random'
    -- Config.PlateFormat = 'LLLNNNN'   -- ABC1234  (two spaces at the end)
    -- Config.PlateFormat = 'LL NN LL'  -- AB 12 CD
    -- Config.PlateFormat = 'NNNN LLL'  -- 1234 ABC
    ```

#### Showcase
- `Config.Showcase`:
  - `coords` (vector4): where the preview vehicle is created (x, y, z, heading)
  - `rotationSpeed` (number): slow rotation per frame, e.g. `0.05`
  - `camOffset` (vector3): camera position relative to `coords`
  - `camFov` (number): camera field of view

#### Garages
`Config.Garages` is an array of garage definitions.

Each garage:
- `name` (string): displayed as the menu header (shown in UI)
- `allowedRoles` (array|string|number|nil): Discord role IDs allowed to open this garage
  - If omitted/empty: default allow
- `interactions` (array): list of interaction points for this garage
  - Each interaction:
    - `station` (string|nil): station identifier; used to restrict vehicles by allowed stations
    - `coords` (vector3): marker to open the garage menu (must be on foot)
    - `spawns` (vector4[]): spawn points for vehicles created from this interaction
    - `deletes` (vector3[]|nil): optional delete points where drivers can press E to delete a vehicle
- `divisions` (array): menu sub‑sections (accordion). Division visibility is automatic: shown only if it contains at least one usable vehicle for the player.
  - Each division:
    - `label` (string): division name
    - `vehicles` (array): list of vehicles in that division
      - Each vehicle:
        - `model` (string): spawn name/model name (e.g. `police`, `nn21hoe`)
        - `name` (string|nil): friendly name for the UI
        - `roles` (array|string|number|nil): Discord roles required to use this vehicle
          - If omitted/empty: default allow
        - `stations` (array|string|number|nil): list of station identifiers where this vehicle can appear/spawn
          - If omitted/empty: allowed at any station
        - `plateFormat` (string|nil): per‑vehicle plate pattern override (see Global Plate Format). If set to `'random'`, forces random for this vehicle regardless of global.
        - Customization (all optional):
          - `livery` (number): vehicle livery index
          - `extras` (array|map):
            - Array form: list of extras to enable, all others will be disabled (0..12)
            - Map form: `{ [extraId] = true|false }`, unspecified extras are disabled
          - `mods` (array|map):
            - Map form: `{ [modType] = index }`
            - Array form: `{ { type = number, index = number }, ... }`
            - Common mod types: 11 Engine, 12 Brakes, 13 Transmission, 15 Suspension, 16 Armor; many others 0..49
          - Appearance:
            - `primaryColor`, `secondaryColor`, `pearlescentColor`, `wheelColor` (0..160)
            - `windowTint` (0..6)
            - `dirtLevel` (0.0..15.0)

Notes:
- If `divisions` is not provided, the legacy `vehicles` array at the garage level is supported and shown as a single division.
- Division‑level role gates were removed by design; visibility is driven by whether it has usable vehicles for the player.

#### Example Snippet
```lua
Config.Garages = {
    {
        name = "LSPD Vehicles",
        allowedRoles = { "LSPD" },
        interactions = {
            {
                -- Station identifier for this interaction (used to restrict vehicles to stations)
                station = "MissionRow",
                coords = vector3(441.0, -982.0, 30.0),
                -- Optional list of vehicle delete points for this station
                -- Drive the vehicle onto one of these points and press E to delete it
                deletes = {
                    vector3(407.8673, -1003.6677, 29.2662)
                },
                spawns = {
                    vector4(408.55, -980.61, 29.27, 47.31),
                    vector4(407.6514, -984.3986, 29.2660, 52.9018),
                    vector4(407.7188, -988.7012, 29.2663, 52.3810)
                }
            },
            {
                station = "DelPerro",
                coords = vector3(-1066.1061, -849.3706, 5.0417),
                deletes = {
                    vector3(-1070.7610, -854.0753, 4.8671)
                },
                spawns = {
                    vector4(-1039.6621, -855.7144, 4.8765, 51.3608),
                    vector4(-1042.3418, -858.7537, 4.8882, 57.0557)
                }
            }
        },
        divisions = {
            {
                label = "Patrol",
                vehicles = {
                    {
                        model = "nn21hoe",
                        name = "2021 Tahoe",
                        roles = { "LSPD Officer", "LSPD Officer II", "LSPD Senior Officer", "LSPD Supervisor" },
                        -- Optional station restriction: if set, this vehicle will only be available at these station identifiers
                        -- stations = { "MissionRow" },
                        -- Optional per-vehicle plate format override. If set, it overrides Config.PlateFormat for this vehicle only.
                        -- Use 'random' for random alphanumeric, or a pattern up to 8 chars using L=letter, N=digit, others=space.
                        -- Examples: 'LLLNNNN', 'LL NN L ', 'NNNN    '
                        -- plateFormat = 'LLLNNNN',
                        -- Optional customization (all fields optional)
                        -- Use a specific livery index if the model supports it
                        livery = 0,
                        -- Extras can be either an array (enable only these extras)
                        -- or a map of extraId => true/false
                        -- Array form example (enable extras 1 and 3):
                        extras = { 4, 8, 9, 11 },
                        -- Map form example (uncomment to use):
                        -- extras = { [1] = true, [2] = false, [3] = true },
                        -- Vehicle mods: either a map of modType => index, or an array of {type=, index=}
                        -- Common mod types: 11 = Engine, 12 = Brakes, 13 = Transmission, 15 = Suspension, 16 = Armor
                        mods = { [5] = 0, [27] = 0, [28] = 0, [42] = 0, [43] = 0, [44] = 0 }, -- stage 2 engine/brakes/trans
                        -- Optional appearance
                        -- Color indices: 0..160 (GTA palette)
                        primaryColor = 0,          -- black
                        secondaryColor = 0,
                        pearlescentColor = 0,
                        wheelColor = 0,
                        windowTint = 0,            -- 0..6 (0 none, 1 pure black, 2 dark smoke, 3 light smoke, 4 stock, 5 limo, 6 green)
                        dirtLevel = 0.0            -- 0.0 (clean) .. 15.0 (dirty)
                    },
                    { model = "nn25fpiu", name = "2025 FPIU", roles = { "LSPD Officer II", "LSPD Senior Officer", "LSPD Supervisor" },  livery = 0, extras = { 4, 8, 9, 11 }, mods = { [27] = 0, [28] = 0, [29] = 0, [42] = 0, [43] = 0, [44] = 0 }, primaryColor = 0, secondaryColor = 0, pearlescentColor = 0, wheelColor = 0, windowTint = 0, dirtLevel = 0.0 },
                    { model = "nn21hoe", name = "2021 Tahoe ST", roles = { "LSPD Senior Officer", "LSPD Supervisor" }, livery = 0, extras = { 6, 8, 9, 11 }, mods = { [5] = 0, [27] = 0, [28] = 0, [42] = 0, [43] = 0, [44] = 0 }, primaryColor = 0, secondaryColor = 0, pearlescentColor = 0, wheelColor = 0, windowTint = 0, dirtLevel = 0.0 },
                    { model = "nn25fpiu", name = "2025 FPIU ST", roles = { "LSPD Supervisor" }, livery = 0, extras = { 5, 6, 8, 9, 11 }, mods = { [27] = 0, [28] = 0, [29] = 0, [42] = 0, [43] = 0, [44] = 0 }, primaryColor = 0, secondaryColor = 0, pearlescentColor = 0, wheelColor = 0, windowTint = 0, dirtLevel = 0.0 },
                }
            }
        }
    }
}
```

---

### Runtime Behavior and UX
- Approach an interaction marker on foot and press E to open the garage.
- Menu opens at left‑center; header shows `garage name — station` (if station set).
- Divisions are expandable; click a vehicle to preview it on the pedestal.
- Lights button enables only for emergency class (18) vehicles; it toggles sirens (muted) on the preview only.
- Spawn button enables if a vehicle is selected and at least one spawn point is clear.
- Press Spawn: screen fades out, UI closes, you exit the isolation bucket, and the server picks the first clear spawn. Screen fades in only after you are seated.
- Drive to a delete point; when in the driver seat within range, a hint appears to press E to delete the vehicle.

---

### Security Model
- All authorization (garage access, per‑vehicle roles, station limits) is validated on the server.
- Spawn requests are server‑authorized by model only; clients do not control customization or placement.
- Customization applied on spawn is sourced from server‑validated config, not from NUI.
- Server selects spawn position; if all slots are full, the spawn is refused and UI is updated.
- Players are moved to a unique routing bucket while the menu is open to avoid interference.

---

### Events and Integrations

#### Server Internal Events
- `moderngarage:spawned (netId:number, plate:stringm, source:number)`
  - Emitted when a player spawns a vehicle.
- `moderngarage:deleted (netId:number, plate:string, source:number)`
  - Emitted when a player deletes a vehicle via a delete point.

---

### Role and Station Logic
- Garage open: if `allowedRoles` empty/missing → allowed; else requires intersection with player’s Discord roles.
- Per‑vehicle roles: if `roles` empty/missing → allowed; else requires intersection.
- Station restriction: if interaction has `station` and the vehicle `stations` list is non‑empty, the station must be present in that list for the vehicle to show/spawn.
- Discord roles are expected as IDs (strings). The server normalizes inputs and tolerates `nil`, single value, or arrays.

---

### Plate Generation
- Default: `Config.PlateFormat = 'random'` → 8 random uppercase alphanumeric characters.
- Pattern: up to 8 chars; `L` = A–Z, `N` = 0–9; others become spaces. Remaining positions are space‑padded.
- Per‑vehicle override: set `plateFormat` on a vehicle to supersede the global for that spawn only.

---

### Vehicle Customization Implementation
- Livery: applied if the model supports it.
- Extras: strict mode — only listed extras are enabled; all others (0..12) are disabled.
- Mods: supports map or array form; applied after `SetVehicleModKit(veh, 0)`.
- Colors/Tint/Dirt: indices and ranges are clamped; existing values preserved when partially provided.
- Customization is applied both to preview and spawned vehicles (spawn customization is server‑authorized).

---

### Spawn Selection and Availability
- Server scans the configured `spawns` list for the current interaction and picks the first clear slot within a small radius.
- While the menu is open, the client polls the server each second for availability to enable/disable the Spawn button and show a warning when full.
- If a race condition occurs (slot taken just before spawn), the server denies the spawn and notifies the client to fade back in.

---

### Routing Buckets
- When the menu opens, the server moves the player to a unique bucket equal to their server id.
- On Close or Spawn, the client tells the server to return them to bucket `0`.

---

### Delete Zones
- If an interaction defines `deletes`, the client draws red markers there.
- When the player (driver seat) is within 2.0 units, a help prompt appears: `Press ~INPUT_CONTEXT~ to delete this vehicle`.
- On E press: screen fades out, vehicle is deleted, and the server event `moderngarage:deleted` is emitted with `netId` and `plate`.

---

### Troubleshooting
- “No vehicles appear in the menu”
  - Ensure your `night_discordapi` is running and returns role IDs
  - Verify garage `allowedRoles` uses matching IDs for your Discord server
  - Confirm division vehicles either have no `roles` or that you possess one of the listed roles
  - If using station restrictions, ensure your interaction has the intended `station` and vehicles include that station when restricted
- “Spawn button is greyed out”
  - All spawns may be full; wait for a spot or free one up
  - Ensure the selected interaction has `spawns` defined
- “Lights button disabled”
  - Only class 18 (emergency) vehicles support preview light toggling
- “Plates look odd”
  - Review `Config.PlateFormat` and any per‑vehicle `plateFormat`; remember patterns are padded to 8 chars and non `L/N` become spaces

---

### Extending
- Add more divisions or interactions per garage as needed.
- Add per‑vehicle liveries/extras/mods/colors to standardize fleet setups.
- Hook `moderngarage:spawned` and `moderngarage:deleted` on the server to integrate with fuel, MDT, or persistence systems.

---

### Versioning and Credits
- Version: 1.0.0
- Author: Grandpa_Rex
- Dependency: `night_discordapi` (must be started before this resource)
