Config = {}

-- Global plate format
-- Set to 'random' (default) to use random 8-char alphanumeric plates.
-- Or provide a pattern up to 8 characters using:
--   L = random uppercase letter (A-Z)
--   N = random digit (0-9)
--   space or any other character = treated as a space
-- If the pattern is shorter than 8, remaining positions are filled with spaces.
-- Examples:
--   Config.PlateFormat = 'LLLNNNN'      -- e.g., ABC1234 
--   Config.PlateFormat = 'LL NN LL'     -- e.g., AB 12 CD (spaces preserved)
--   Config.PlateFormat = 'NNNN LLL'     -- e.g., 1234 ABC
Config.PlateFormat = 'random'

Config.Showcase = {
    coords = vector4(405.2961, -974.0479, -99.0042, 358.0270),
    rotationSpeed = 0.05,
    -- Camera settings for fixed showcase view
    camOffset = vector3(0.0, 6.0, 1.5), -- offset from coords to place camera (x,y,z)
    camFov = 60.0
}

Config.Garages = {
    {
        name = "LSPD Vehicles",
        allowedRoles = { "LEO" },
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
                    {
                        model = "nn25fpiu",
                        name = "2025 FPIU",
                        stations = { "MissionRow" },
                        -- plateFormat = 'random', -- example of per-vehicle override forcing random even if global uses a pattern
                        livery = 0,
                        extras = { 4, 8, 9, 11 },
                        mods = { [27] = 0, [28] = 0, [29] = 0, [42] = 0, [43] = 0, [44] = 0 },
                        -- Appearance example
                        primaryColor = 0,        -- white
                        secondaryColor = 0,
                        pearlescentColor = 0,
                        wheelColor = 0,
                        windowTint = 0,
                        dirtLevel = 0.0
                    },
                    
                }
            },
            {
                label = "Traffic",
                -- Division visibility is automatic: it will only show if the player has at least one usable vehicle in it
                vehicles = {
                    { model = "police3", name = "Traffic Interceptor", roles = { "LSPD" }, stations = { "DelPerro" }, livery = 2, primaryColor = 0, secondaryColor = 0, windowTint = 2, dirtLevel = 0.0 },
                    { model = "policeb", name = "Motor Unit", roles = { "Trooper I" }, primaryColor = 0, secondaryColor = 0, dirtLevel = 0.0 }
                }
            }
        }
    }
}