'use strict';

function City(source) {
    if (typeof(source) === 'number') {
        this.map_size = source;
        this.map_size_edge = this.map_size + 2;
        this.map_size2 = this.map_size >> 1;

        this.year = 1900;
        this.month = 1;
        this.ticks = 0;
        this.disaster_ticks = -1;

        this.tornado = null;
        this.monster = null;
        this.flood_time_left = 0;
        this.bank_working = false;

        this.city_name = '';
        this.population = 0;
        this.prev_population = 0;
        this.next_population = 2000;    // Town
        this.funds = 20000;
        this.hidden_assets = 0;
        this.rotate = 0;

        this.ruleset = 'micropolis';
        this.difficulty = 'novice';

        this.tax_rate = 7;
        this.traffic_funds = 100;
        this.traffic_funds_term = 100;
        this.police_funds = 100;
        this.police_funds_term = 100;
        this.fire_funds = 100;
        this.fire_funds_term = 100;

        this.tax_collected = 0;
        this.special_income = 0;
        this.traffic_cost = 0;
        this.police_cost = 0;
        this.fire_cost = 0;

        this.afforestion = 0;   // hidden parameter
        this.gift_buildings = [];
        this.event_reserved = [
            {type:'gift', name:'your_house', cond:['population', 2000]},
            {type:'gift', name:'terminal_station', cond:['rail', 300]},
            {type:'gift', name:'terminal_station', cond:['rail', 600]},
            {type:'gift', name:'park_casino', cond:['road', 200]},
            {type:'gift', name:'park_casino', cond:['road', 300]},
            {type:'gift', name:'park_casino', cond:['road', 400]},
            {type:'gift', name:'park_casino', cond:['gift', 3]},
            {type:'gift', name:'park_casino', cond:['gift', 6]},
            {type:'gift', name:'park_casino', cond:['gift', 9]},
            {type:'gift', name:'police_hq', cond:['police_dept', 6]},
            {type:'gift', name:'police_hq', cond:['police_dept', 12]},
            {type:'gift', name:'police_hq', cond:['police_dept', 18]},
            {type:'gift', name:'fire_hq', cond:['fire_dept', 6]},
            {type:'gift', name:'fire_hq', cond:['fire_dept', 12]},
            {type:'gift', name:'fire_hq', cond:['fire_dept', 18]},
            {type:'gift', name:'zoo', cond:['stadium1', 1, 'stadium2', 1]},
            {type:'gift', name:'library', cond:['school', 3]},
            {type:'gift', name:'library', cond:['school', 6]},
            {type:'gift', name:'library', cond:['school', 9]},
            {type:'gift', name:'monster_statue', cond:['population', 500000]},
            {type:'gift', name:'monolith', cond:['population', 700000]},
            {type:'gift', name:'land_fill', cond:['land_clear', 150]},
            {type:'gift', name:'land_fill', cond:['land_clear', 100]},
            {type:'gift', name:'land_fill', cond:['land_clear', 50]},
            {type:'gift', name:'land_fill', cond:['land_clear', 30]},
        ];
        this.election = null;

        this.tile_data  = new Uint16Array(this.map_size_edge * this.map_size_edge);
        // R/C/I = 0:empty, 1:1x1(R),3x3(C,I) 2-5:3x3 house 6:top(NS) 7:top(WE)
        this.tile_sub   = new Uint8Array(this.map_size_edge * this.map_size_edge);

        this.tile_fire  = new Uint8Array(this.map_size_edge * this.map_size_edge);

        this.hist_r         = new Uint8Array(12 * GRAPH_YEARS);
        this.hist_c         = new Uint8Array(12 * GRAPH_YEARS);
        this.hist_i         = new Uint8Array(12 * GRAPH_YEARS);
        this.hist_crime     = new Uint8Array(12 * GRAPH_YEARS);
        this.hist_pollution = new Uint8Array(12 * GRAPH_YEARS);
        this.hist_value     = new Uint8Array(12 * GRAPH_YEARS);

        this.disaster_occurs = false;
    } else {
        if (source.signature !== 'TinyCity') {
            throw new Error('Not a TinyCity file');
        }
        // TODO validation

        this.map_size = source.map_size;
        this.map_size_edge = this.map_size + 2;
        this.map_size2 = this.map_size >> 1;

        this.year = source.year;
        this.month = source.month;
        this.ticks = source.ticks;
        this.disaster_ticks = source.disaster_ticks;

        this.tornado = source.tornado;
        this.monster = source.monster;
        this.flood_time_left = source.flood_time_left;
        this.bank_working = source.bank_working;

        this.city_name = source.city_name;
        this.population = source.population;
        this.prev_population = source.prev_population;
        this.next_population = source.next_population;
        this.funds = source.funds;
        this.hidden_assets = source.hidden_assets;
        this.rotate = source.rotate;

        this.ruleset = source.ruleset;
        this.difficulty = source.difficulty;

        this.tax_rate = source.tax_rate;
        this.traffic_funds = source.traffic_funds;
        this.traffic_funds_term = source.traffic_funds_term;
        this.police_funds = source.police_funds;
        this.police_funds_term = source.police_funds_term;
        this.fire_funds = source.fire_funds;
        this.fire_funds_term = source.fire_funds_term;

        this.tax_collected = source.tax_collected;
        this.special_income = source.special_income;
        this.traffic_cost = source.traffic_cost;
        this.police_cost = source.police_cost;
        this.fire_cost = source.fire_cost;

        this.afforestion = source.afforestion;
        this.gift_buildings = [];
        for (let i = 0; i < source.gift_buildings.length; i++) {
            this.gift_buildings.push(BUILD_ICON_INFO_GIFT[source.gift_buildings[i]]);
        }
        this.event_reserved = source.event_reserved;
        this.election = source.election;

        this.tile_data = to_u16array(source.tile_data, this.map_size_edge, this.map_size_edge * this.map_size_edge);
        this.tile_sub  = to_u8array(source.tile_sub, this.map_size_edge, this.map_size_edge * this.map_size_edge);
        this.tile_fire = to_u8array(source.tile_fire, this.map_size_edge, this.map_size_edge * this.map_size_edge);

        this.hist_r         = to_u8array(source.hist_r, 0, 12 * GRAPH_YEARS);
        this.hist_c         = to_u8array(source.hist_c, 0, 12 * GRAPH_YEARS);
        this.hist_i         = to_u8array(source.hist_i, 0, 12 * GRAPH_YEARS);
        this.hist_crime     = to_u8array(source.hist_crime, 0, 12 * GRAPH_YEARS);
        this.hist_pollution = to_u8array(source.hist_pollution, 0, 12 * GRAPH_YEARS);
        this.hist_value     = to_u8array(source.hist_value, 0, 12 * GRAPH_YEARS);

        this.disaster_occurs = source.disaster_occurs;
    }
    this.base_score = -1;

    // none:0, power off:1, power on:2
    this.tile_power = new Uint8Array(this.map_size_edge * this.map_size_edge);
    // 0-254:(traffic volume), 255:no roads
    this.tile_road  = new Uint8Array(this.map_size_edge * this.map_size_edge);

    this.tile_population = new Uint8Array(this.map_size2 * this.map_size2);
    this.tile_pollution  = new Uint8Array(this.map_size2 * this.map_size2);
    this.tile_crime      = new Uint8Array(this.map_size2 * this.map_size2);
    this.tile_land_value = new Uint8Array(this.map_size2 * this.map_size2);
    this.tile_police_d   = new Uint8Array(this.map_size2 * this.map_size2);
    this.tile_fire_d     = new Uint8Array(this.map_size2 * this.map_size2);
    let map_data8_size   = this.map_size >> 3;
    this.tile_prev_pops  = new Int8Array(map_data8_size * map_data8_size);
    this.tile_grow_pops  = new Int8Array(map_data8_size * map_data8_size);

    this.r_zone_count = 0;
    this.c_zone_count = 0;
    this.i_zone_count = 0;
    this.r_zone_pops = 0;
    this.c_zone_pops = 0;
    this.i_zone_pops = 0;
    this.r_demand = 0;
    this.c_demand = 0;
    this.i_demand = 0;
    this.problems = {
        crime: 0,
        housing_cost: 0,
        pollution: 0,
        taxes: 0,
        traffic_jam: 0,
        unemployment: 0,
    };
    this.problems_worst = [];
    this.month_gdp = 0;
    this.assessed_value = 0;

    this.calculate_power_grid_required = false;
    this.update_power_grid_required = false;
    this.auto_bulldoze = true;

    this.r_demand_capacity = 0;
    this.c_demand_capacity = 0;
    this.i_demand_capacity = 0;

    let power_supply_left = 0;
    let last_blackout_x = -1;
    let last_blackout_y = -1;
    let ticks2 = 0;


    function to_array(src, offset, length) {
        let dst = new Array(length);
        for (let i = 0; i < length; i++) {
            dst[i] = src[i + offset];
        }
        return dst;
    }
    function to_u8array(src, offset, length) {
        let dst = new Uint8Array(length);
        if (src != null) {
            for (let i = 0; i < src.length; i++) {
                dst[i + offset] = src[i];
            }
        }
        return dst;
    }
    function to_u16array(src, offset, length) {
        let dst = new Uint16Array(length);
        if (src != null) {
            for (let i = 0; i < src.length; i++) {
                dst[i + offset] = src[i];
            }
        }
        return dst;
    }


    function get_flag_v(self, i, flag, val) {
        return (self.tile_data[i] & flag) != 0 ? val : 0;
    }
    this.neighbor_flag_ns = function(x, y, flag) {
        const i = x + 1 + (y + 1) * this.map_size_edge;
        return (this.tile_data[i - this.map_size_edge] & flag) || (this.tile_data[i + this.map_size_edge] & flag);
    };
    this.neighbor_flag_we = function(x, y, flag) {
        const i = x + 1 + (y + 1) * this.map_size_edge;
        return (this.tile_data[i - 1] & flag) || (this.tile_data[i + 1] & flag);
    };
    this.neighbor_flag3_we = function(x, y, flag) {
        const i = x + 1 + (y + 1) * this.map_size_edge;
        const n = get_flag_v(this, i - this.map_size_edge * 2 - 1, flag, 1) + get_flag_v(this, i - this.map_size_edge * 2, flag, 1) + get_flag_v(this, i - this.map_size_edge * 2 + 1, flag, 1);
        const s = get_flag_v(this, i + this.map_size_edge * 2 - 1, flag, 1) + get_flag_v(this, i + this.map_size_edge * 2, flag, 1) + get_flag_v(this, i + this.map_size_edge * 2 + 1, flag, 1);
        const w = get_flag_v(this, i - this.map_size_edge - 2, flag, 1) + get_flag_v(this, i - 2, flag, 1) + get_flag_v(this, i + this.map_size_edge - 2, flag, 1);
        const e = get_flag_v(this, i - this.map_size_edge + 2, flag, 1) + get_flag_v(this, i + 2, flag, 1) + get_flag_v(this, i + this.map_size_edge + 2, flag, 1);
        return n + s < w + e;
    };
    this.neighbor_flag4_we = function(x, y, flag) {
        const i = x + 1 + (y + 1) * this.map_size_edge;
        const n = get_flag_v(this, i - this.map_size_edge * 2 - 1, flag, 1) + get_flag_v(this, i - this.map_size_edge * 2, flag, 1) + get_flag_v(this, i - this.map_size_edge * 2 + 1, flag, 1) + get_flag_v(this, i - this.map_size_edge * 2 + 2, flag, 1);
        const s = get_flag_v(this, i + this.map_size_edge * 3 - 1, flag, 1) + get_flag_v(this, i + this.map_size_edge * 3, flag, 1) + get_flag_v(this, i + this.map_size_edge * 3 + 1, flag, 1) + get_flag_v(this, i + this.map_size_edge * 3 + 2, flag, 1);
        const w = get_flag_v(this, i - this.map_size_edge - 2, flag, 1) + get_flag_v(this, i - 2, flag, 1) + get_flag_v(this, i + this.map_size_edge - 2, flag, 1) + get_flag_v(this, i + this.map_size_edge * 2 - 2, flag, 1);
        const e = get_flag_v(this, i - this.map_size_edge + 3, flag, 1) + get_flag_v(this, i + 3, flag, 1) + get_flag_v(this, i + this.map_size_edge + 3, flag, 1) + get_flag_v(this, i + this.map_size_edge * 2 + 3, flag, 1);
        return n + s < w + e;
    };
    this.get_neighbor_flags = function(x, y, flag) {
        const i = x + 1 + (y + 1) * this.map_size_edge;
        const j = get_flag_v(this, i - this.map_size_edge, flag, 8) | get_flag_v(this, i + 1, flag, 4) | get_flag_v(this, i + this.map_size_edge, flag, 2) | get_flag_v(this, i - 1, flag, 1);

        switch (j) {
        default:
            return 0;
        case 5: // 0101
        case 1: // 0001
        case 4: // 0100
            return 1;
        case 12:// 1100
            return 2;
        case 6: // 0110
            return 3;
        case 3: // 0011
            return 4;
        case 9: // 1001
            return 5;
        case 7: // 0111
            return 6;
        case 11:// 1011
            return 7;
        case 13:// 1101
            return 8;
        case 14:// 1110
            return 9;
        case 15:// 1111
            return 10;
        }
    };
    this.get_coast_neighbor_flag = function(x, y) {
        const i = x + 1 + (y + 1) * this.map_size_edge;
        const j = get_flag_v(this, i - this.map_size_edge, M_LAND, 8) | get_flag_v(this, i + 1, M_LAND, 4) | get_flag_v(this, i + this.map_size_edge, M_LAND, 2) | get_flag_v(this, i - 1, M_LAND, 1);

        switch (j) {
        default:
            return -1;
        case 12:// 1100
            return 2;
        case 6: // 0110
            return 3;
        case 3: // 0011
            return 4;
        case 9: // 1001
            return 5;
        case 14:// 1110
            return 6;
        case 7: // 0111
            return 7;
        case 11:// 1011
            return 8;
        case 13:// 1101
            return 9;
        case 15:// 1111
            return 10;
        }
    };
    this.station_exit = function(pos) {
        let list = [];
        for (let i = -1; i < 2; i++) {
            let p;
            if ((this.tile_data[pos - this.map_size_edge * 2 + i] & M_RAIL_WT) !== 0) {
                list.push({pos: pos - this.map_size_edge + i, dir: 0});
            }
            if ((this.tile_data[pos + this.map_size_edge * 2 + i] & M_RAIL_WT) !== 0) {
                list.push({pos: pos + this.map_size_edge + i, dir: 2});
            }
            if ((this.tile_data[pos - 2 + this.map_size_edge * i] & M_RAIL_WT) !== 0) {
                list.push({pos: pos - 1 + this.map_size_edge * i, dir: 3});
            }
            if ((this.tile_data[pos + 2 + this.map_size_edge * i] & M_RAIL_WT) !== 0) {
                list.push({pos: pos + 1 + this.map_size_edge * i, dir: 1});
            }
        }
        if (list.length > 0) {
            return choice_random(list);
        } else {
            return null;
        }
    };
    this.is_building = function(x, y) {
        let t = this.tile_data[x + 1 + (y + 1) * this.map_size_edge];
        return (t & 0x3F00) !== 0;
    };
    this.is_bridge = function(x, y) {
        let t = this.tile_data[x + 1 + (y + 1) * this.map_size_edge];
        return (t & M_LAND) === 0 && (t & M_RDRLWR_WT) !== 0;
    };

    function tiles_bulldoze_cost(self, x1, x2, y1, y2) {
        if (x1 < 0 || y1 < 0 || x2 > self.map_size || y2 > self.map_size) {
            return -1;
        }
        let cost = 0;
        for (let y = y1; y < y2; y++) {
            let i = 1 + (y + 1) * self.map_size_edge;
            for (let x = x1; x < x2; x++) {
                if (self.tile_fire[i + x] !== 0) {
                    return -1;
                }
                let tile_at = self.tile_data[i + x];
                if (tile_at === M_RUBBLE || tile_at === M_TREE || tile_at === M_WIRE) {
                    if (self.auto_bulldoze) {
                        cost++;
                    } else {
                        return -1;
                    }
                } else if (tile_at !== M_LAND) {
                    return -1;
                }
            }
        }
        return cost;
    }
    function tile_fill_rect(self, data, x1, x2, y1, y2, t) {
        for (let y = y1; y < y2; y++) {
            let i = 1 + (y + 1) * self.map_size_edge;
            for (let x = x1; x < x2; x++) {
                data[i + x] = t;
            }
        }
    }
    function tile_water_area_is_clear(self, x1, x2, y1, y2) {
        for (let y = y1; y < y2; y++) {
            let i = 1 + (y + 1) * self.map_size_edge;
            for (let x = x1; x < x2; x++) {
                let t = self.tile_data[i + x];
                if ((t & M_LAND) === 0 && (t & 0x38) !== 0) {
                    return false;
                }
            }
        }
        return true;
    }
    function tile_land_fill_rect(self, x1, x2, y1, y2) {
        for (let y = y1; y < y2; y++) {
            var i = 1 + (y + 1) * self.map_size_edge;
            for (let x = x1; x < x2; x++) {
                if (self.tile_data[i + x] === M_WATER) {
                    self.tile_data[i + x] = M_LAND;
                }
            }
        }
    }
    // return:
    //   0-3 ramp direction
    //   -1  failed
    this.get_bridge_direction = function(x, y, tile) {
        let pos = x + 1 + (y + 1) * this.map_size_edge;
        let t1 = this.tile_data[pos - this.map_size_edge];
        let t2 = this.tile_data[pos + 1];
        let t3 = this.tile_data[pos + this.map_size_edge];
        let t4 = this.tile_data[pos - 1];
        if ((t1 & M_LAND) !== 0 && (t1 & tile) !== 0) {
            return 2;
        }
        if ((t2 & M_LAND) !== 0 && (t2 & tile) !== 0) {
            return 3;
        }
        if ((t3 & M_LAND) !== 0 && (t3 & tile) !== 0) {
            return 0;
        }
        if ((t4 & M_LAND) !== 0 && (t4 & tile) !== 0) {
            return 1;
        }
        return -1;
    };
    // return -1 if failed
    function get_bridge_length(self, x, y, dir) {
        let length = 0;
        if (dir === 0 || dir === 2) {
            let pos = x + 1 + (y + 1) * self.map_size_edge;
            let dy = (dir === 0 ? -self.map_size_edge : self.map_size_edge);
            let lbound = self.map_size_edge;
            let ubound = (self.map_size_edge - 1) * self.map_size_edge;
            while (pos >= lbound && pos < ubound) {
                let t = self.tile_data[pos];
                if ((t & M_LAND) !== 0) {
                    break;
                }
                if (t !== M_WATER) {
                    return -1;
                }
                length++;
                pos += dy;
            }
        } else {
            let pos = 1 + (y + 1) * self.map_size_edge;
            let dx = (dir === 1 ? 1 : -1);
            while (x >= 0 && x < self.map_size) {
                let t = self.tile_data[pos + x];
                if ((t & M_LAND) !== 0) {
                    break;
                }
                if (t !== M_WATER) {
                    return -1;
                }
                length++;
                x += dx;
            }
        }
        return length;
    }
    this.get_building_size = function(a_tile) {
        let tile = a_tile & F_BLDGS;

        switch (tile) {
        case M_R_ZONE:
        case M_C_ZONE:
        case M_I_ZONE:
        case M_HOSPITAL:
        case M_SCHOOL:
        case M_POLICE_D:
        case M_FIRE_D:
        case M_STATION:
            return 3;
        case M_GOODS_ST:
        case M_STADIUM1:
        case M_STADIUM2:
        case M_PORT:
        case M_COAL_PWR:
        case M_GAS_PWR:
        case M_NUKE_PWR:
            return 4;
        case M_AIRPORT:
            return 6;
        default:
            if (tile >= M_GIFT_WT) {
                return 3;
            }
            return 1;
        }
    };
    this.calc_power_supply_append = function(x1, y1, x2, y2) {
        for (let y = y1; y < y2; y++) {
            let pos = 1 + (y + 1) * this.map_size_edge;
            for (let x = x1; x < x2; x++) {
                this.tile_power[pos + x] = 1;
            }
        }

        let found = false;
        for (let x = x1; x < x2; x++) {
            if (this.tile_power[x + 1 + y1 * this.map_size_edge] === 2) {
                found = true;
                break;
            }
            if (this.tile_power[x + 1 + (y2 + 1) * this.map_size_edge] === 2) {
                found = true;
                break;
            }
        }
        if (!found) {
            for (let y = y1; y < y2; y++) {
                if (this.tile_power[x1 + (y + 1) * this.map_size_edge] === 2) {
                    found = true;
                    break;
                }
                if (this.tile_power[x2 + 1 + (y + 1) * this.map_size_edge] === 2) {
                    found = true;
                    break;
                }
            }
        }
        if (found) {
            this.spread_power_grid([x1 + 1 + (y1 + 1) * this.map_size_edge]);
            this.update_power_grid_required = true;
        }
    };

    this.get_center = function(cx, cy) {
        if (cx < 0) {
            return {x:cx, y:cy};
        }
        const tile_data_at = this.tile_data[cx + 1 + (cy + 1) * this.map_size_edge];
        let x1, x2;
        let y1, y2;

        if (tile_data_at === M_ROAD_WT || tile_data_at === M_RAIL_WT) {
            x1 = cx - 1;
            x2 = cx + 2;
            y1 = cy - 1;
            y2 = cy + 2;
        } else {
            switch (this.get_building_size(tile_data_at)) {
            case 1:
                return {x:cx, y:cy};
            case 3:
                x1 = cx - 1;
                x2 = cx + 2;
                y1 = cy - 1;
                y2 = cy + 2;
                break;
            case 4:
                x1 = cx - 2;
                x2 = cx + 2;
                y1 = cy - 2;
                y2 = cy + 2;
                break;
            case 6:
                x1 = cx - 3;
                x2 = cx + 3;
                y1 = cy - 3;
                y2 = cy + 3;
                break;
            }
        }
        if (x1 < 0) {
            x1 = 0;
        }
        if (x2 > this.map_size_edge) {
            x2 = this.map_size_edge;
        }
        if (y1 < 0) {
            y1 = 0;
        }
        if (y2 > this.map_size_edge) {
            y2 = this.map_size_edge;
        }
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                if ((this.tile_data[x + 1 + (y + 1) * this.map_size_edge] & F_CENTER) != 0) {
                    return {x:x, y:y};
                }
            }
        }
        return {x:cx, y:cy};
    };
    function get_level_descript(level, low, medium, high) {
        if (level < low) {
            return 'low';
        } else if (level < medium) {
            return 'medium';
        } else if (level < high) {
            return 'high';
        } else {
            return 'very_high';
        }
    }
    this.get_info_at = function(x, y) {
        const pt = this.get_center(x, y);
        if (pt.x < 0) {
            return null;
        }
        let pos = pt.x + 1 + (pt.y + 1) * this.map_size_edge;
        const tile = this.tile_data[pos];
        let info = {
            x: pt.x,
            y: pt.y,
            size: 1,
        };
        let list = [];

        let pos2 = (pt.x >> 1) + (pt.y >> 1) * this.map_size2;

        switch (tile) {
        case M_WATER:
            info.name = 'water_area';
            break;
        case M_LAND:
            info.name = 'land_clear';
            break;
        case M_RUBBLE:
            info.name = 'rubble';
            break;
        case M_TREE:
            info.name = 'tree';
            break;
        case M_ROAD:
        case M_ROADWIRE:
            info.name = 'road';
            list.push({title: 'traffic_volume', val:this.tile_road[pos] * 2, unit:'/min'});
            break;
        case M_ROAD_WT:
        case M_ROAD_WT | F_CENTER:
            info.name = 'road_bridge';
            list.push({title: 'traffic_volume', val:this.tile_road[pos] * 2, unit:'/min'});
            break;
        case M_ROADRAIL:
            info.name = 'crossing';
            list.push({title: 'traffic_volume', val:this.tile_road[pos] * 2, unit:'/min'});
            break;
        case M_RAIL:
        case M_RAILWIRE:
            info.name = 'railroad';
            break;
        case M_RAIL_WT:
        case M_RAIL_WT | F_CENTER:
            info.name = 'rail_bridge';
            break;
        case M_WIRE:
        case M_WIRE_WT:
        case M_WIRE_WT | F_CENTER:
            info.name = 'wire';
            break;
        default:
            break;
        }

        if (info.name == null) {
            switch (tile & F_BLDGS) {
            case M_R_ZONE:
                info.name = 'r_zone';
                {
                    let population = 0;
                    for (let yy = -1; yy <= 1; yy++) {
                        let pos2 = pos + yy * this.map_size_edge;
                        for (let xx = -1; xx <= 1; xx++) {
                            let t = this.tile_sub[pos2 + xx];
                            if (t === 1) {
                                population += 20;
                            } else {
                                population += t * 160;
                            }
                        }
                    }
                    list.push({title: 'population', val:population});
                }
                break;
            case M_C_ZONE:
                info.name = 'c_zone';
                info.size = 3;
                list.push({title: 'population', val:this.tile_sub[pos] * 160});
                break;
            case M_I_ZONE:
                info.name = 'i_zone';
                info.size = 3;
                list.push({title: 'population', val:this.tile_sub[pos] * 160});
                break;
            case M_HOSPITAL:
                info.name = 'hospital';
                info.size = 3;
                list.push({title: 'patients', val:160});
                break;
            case M_SCHOOL:
                info.name = 'school';
                info.size = 3;
                list.push({title: 'students', val:160});
                break;
            case M_POLICE_D:
                info.name = 'police_dept';
                info.size = 3;
                list.push({title:'arrested', val:this.tile_sub[pos] >> 1});
                break;
            case M_POLICE_HQ:
                info.name = 'police_hq';
                info.size = 3;
                list.push({title:'arrested', val:this.tile_sub[pos] >> 1});
                break;
            case M_FIRE_D:
                info.name = 'fire_dept';
                info.size = 3;
                list.push({title:'dispatched', val:this.tile_sub[pos] >> 1});
                break;
            case M_FIRE_HQ:
                info.name = 'fire_hq';
                info.size = 3;
                list.push({title:'dispatched', val:this.tile_sub[pos] >> 1});
                break;
            case M_STATION:
                info.name = 'station';
                info.size = 3;
                list.push({title:'passengers', val:this.tile_sub[pos] * 10, unit:'/day'});
                break;
            case M_TERM_STN:
                info.name = 'terminal_station';
                info.size = 3;
                if (this.ruleset === 'tinycity') {
                    list.push({title:'passengers', val:this.tile_sub[pos] * 10, unit:'/day'});
                }
                break;
            case M_STADIUM1:
            case M_STADIUM2:
                info.name = 'stadium';
                info.size = 4;
                list.push({title:'audiences', val:this.tile_sub[pos] * 1000, unit:'/mon'});
                break;
            case M_GOODS_ST:
                info.name = 'goods_st';
                info.size = 4;
                list.push({title:'freight_volume', val:this.tile_sub[pos] * 1000, unit:'t/mon'});
                break;
            case M_PORT:
                info.name = 'sea_port';
                info.size = 4;
                list.push({title:'freight_volume', val:this.tile_sub[pos] * 1000, unit:'t/mon'});
                break;
            case M_AIRPORT:
                info.name = 'airport';
                info.size = 6;
                list.push({title:'passengers', val:this.tile_sub[pos] * 1000, unit:'/mon'});
                break;
            case M_COAL_PWR:
                info.name = 'coal_power_plant';
                info.size = 4;
                switch (this.ruleset) {
                case 'tinycity':
                    list.push({title:'max_output', val:1400, unit:'MW', format:1});
                    break;
                case 'micropolis':
                    list.push({title:'max_output', val:800, unit:'MW', format:1});
                    break;
                }
                break;
            case M_GAS_PWR:
                info.name = 'gas_power_plant';
                info.size = 4;
                list.push({title:'max_output', val:1000, unit:'MW', format:1});
                break;
            case M_NUKE_PWR:
                info.name = 'nuke_power_plant';
                info.size = 4;
                list.push({title:'max_output', val:2000, unit:'MW', format:1});
                break;
            case M_YR_HOUSE:
                info.name = 'your_house';
                list.push({title:'hidden_assets', val:this.hidden_assets});
                break;
            case M_AMUSEMENT:
                info.name = 'amusement_park';
                break;
            case M_CASINO:
                info.name = 'casino';
                break;
            case M_BANK:
                info.name = 'bank';
                break;
            case M_ZOO:
                info.name = 'zoo';
                list.push({title:'llama', val:(this.population > 0 ? Math.round(Math.log(this.population)) : 0)});
                break;
            case M_LIBRARY:
                info.name = 'library';
                break;
            case M_M_STATUE:
                info.name = 'monster_statue';
                break;
            case M_MONOLITH:
                info.name = 'monolith';
                break;
            default:
                info.name = '???';
                break;
            }
        }
        list.unshift({title:'crime', val:get_level_descript(this.tile_crime[pos2], 16, 32, 96)});
        list.unshift({title:'pollution', val:get_level_descript(this.tile_pollution[pos2], 16, 32, 96)});
        list.unshift({title:'land_value', val:get_level_descript(this.tile_land_value[pos2], LAND_VALUE_LOW, LAND_VALUE_MIDDLE, LAND_VALUE_HIGH)});
        info.list = list;
        return info;
    };
    this.calc_build_cost_at = function(x, y, selected) {
        if (x < 0) {
            return -1;
        }
        const pos = x + 1 + (y + 1) * this.map_size_edge;
        const tile_data_at = this.tile_data[pos];
        let cost = 0;

        switch (selected.name) {
        case 'bulldoze':
            if ((tile_data_at & 0x3F00) != 0) {
                switch (tile_data_at) {
                case M_R_ZONE:
                    if (this.tile_sub[pos] === 1) {
                        return 1;
                    } else {
                        return -1;
                    }
                case M_GOODS_ST | F_CENTER:
                case M_STADIUM1 | F_CENTER:
                case M_STADIUM2 | F_CENTER:
                case M_PORT | F_CENTER:
                case M_COAL_PWR | F_CENTER:
                case M_GAS_PWR | F_CENTER:
                case M_NUKE_PWR | F_CENTER:    // 4x4
                    return 16;
                case M_AIRPORT | F_CENTER:     // 6x6
                    return 36;
                default:            // 3x3
                    if ((tile_data_at & F_CENTER) !== 0) {
                        return 9;
                    }
                    break;
                }
            } else if ((tile_data_at & M_LAND) === 0 && (tile_data_at & M_RDRLWR_WT) !== 0) {
                let length = 1;
                let t = tile_data_at & M_RDRLWR_WT;
                let pos2 = pos - this.map_size_edge;
                if ((this.tile_data[pos2] & ~F_CENTER) === t) {
                    while ((this.tile_data[pos2] & ~F_CENTER) === t) {
                        pos2 -= this.map_size_edge;
                        length++;
                    }
                }
                pos2 = pos + this.map_size_edge;
                if ((this.tile_data[pos2] & ~F_CENTER) === t) {
                    while ((this.tile_data[pos2] & ~F_CENTER) === t) {
                        pos2 += this.map_size_edge;
                        length++;
                    }
                }
                pos2 = pos - 1;
                if ((this.tile_data[pos2] & ~F_CENTER) === t) {
                    while ((this.tile_data[pos2] & ~F_CENTER) === t) {
                        pos2--;
                        length++;
                    }
                }
                pos2 = pos + 1;
                if ((this.tile_data[pos2] & ~F_CENTER) === t) {
                    while ((this.tile_data[pos2] & ~F_CENTER) === t) {
                        pos2++;
                        length++;
                    }
                }
                return length;
            }
            break;
        case 'road':
        case 'railroad':
        case 'wire':
            {
                // bridge
                let tile = (selected.name === 'road' ? M_ROAD_WT : selected.name === 'railroad' ? M_RAIL_WT : M_WIRE_WT);
                let dir = this.get_bridge_direction(x, y, tile);
                if (dir >= 0) {
                    let length = get_bridge_length(this, x, y, dir);
                    if (length > 0) {
                        return selected.cost * length * 2;
                    }
                }
            }
            break;
        case 'tree':
            if (this.tile_fire[pos] !== 0) {
                return -1;
            } else if (tile_data_at === M_RUBBLE) {
                return selected.cost + 1;
            } else if (tile_data_at === M_LAND) {
                return selected.cost;
            }
            break;
        case 'stadium':
        case 'goods_st':
        case 'sea_port':
        case 'coal_power_plant':
        case 'gas_power_plant':
        case 'nuke_power_plant':    // 4x4
            cost = tiles_bulldoze_cost(this, x - 1, x + 3, y - 1, y + 3);
            if (cost >= 0) {
                return cost + selected.cost;
            }
            break;
        case 'airport':
            cost = tiles_bulldoze_cost(this, x - 2, x + 4, y - 2, y + 4);
            if (cost >= 0) {
                return cost + selected.cost;
            }
            break;
        case 'land_fill':
            if (tile_water_area_is_clear(this, x - 1, x + 2, y - 1, y + 2)) {
                return selected.cost;
            }
            break;
        default:    // 3x3
            cost = tiles_bulldoze_cost(this, x - 1, x + 2, y - 1, y + 2);
            if (cost >= 0) {
                return cost + selected.cost;
            }
            break;
        }
        return -1;
    };
    this.calc_build_cost_range = function(x1, y1, x2, y2, selected) {
        let cost = 0;

        switch (selected.name) {
        case 'bulldoze':
            if (x1 > x2) {
                let tmp = x1;
                x1 = x2;
                x2 = tmp;
            }
            if (y1 > y2) {
                let tmp = y1;
                y1 = y2;
                y2 = tmp;
            }
            for (let y = y1; y <= y2; y++) {
                for (let x = x1; x <= x2; x++) {
                    let pos = x + 1 + (y + 1) * this.map_size_edge;
                    let t = this.tile_data[pos];
                    if (this.tile_fire[pos] === 0) {
                        if ((t & M_LAND) !== 0 && t !== M_LAND && (t & 0x3F00) === 0) {
                            cost++;
                        }
                    }
                }
            }
            return cost > 0 ? cost : -1;
        case 'road':
        case 'railroad':
        case 'wire':
            {
                let dx = 0, dy = 0;
                if (x1 < x2) {
                    dx = 1;
                } else if (x1 > x2) {
                    dx = -1;
                } else if (y1 < y2) {
                    dy = 1;
                } else {
                    dy = -1;
                }
                while (x1 !== x2 + dx || y1 !== y2 + dy) {
                    let pos = x1 + 1 + (y1 + 1) * this.map_size_edge;
                    if (this.tile_fire[pos] !== 0) {
                        return cost > 0 ? cost : -1;
                    }
                    let t = this.tile_data[pos];
                    switch (t) {
                    case M_RUBBLE:
                    case M_TREE:
                        if (this.auto_bulldoze) {
                            cost += selected.cost + 1;
                        } else {
                            return cost > 0 ? cost : -1;
                        }
                        break;
                    case M_LAND:
                        cost += selected.cost;
                        break;
                    case M_ROAD:
                        if (selected.name !== 'road') {
                            cost += selected.cost;
                        }
                        break;
                    case M_RAIL:
                        if (selected.name !== 'railroad') {
                            cost += selected.cost;
                        }
                        break;
                    case M_WIRE:
                        if (selected.name !== 'wire') {
                            cost += selected.cost;
                        }
                        break;
                    case M_ROADRAIL:
                    case M_ROADWIRE:
                    case M_RAILWIRE:
                        break;
                    default:
                        return cost > 0 ? cost : -1;
                    }
                    x1 += dx;
                    y1 += dy;
                }
            }
            return cost > 0 ? cost : -1;
        }
        return -1;
    };
    function build_bridge_sub(self, x, y, dir, length, tile) {
        let head = 3;
        if (length % 3 === 1) {
            length--;
        }
        if (dir === 0 || dir === 2) {
            let pos = x + 1 + (y + 1) * self.map_size_edge;
            let dpos = (dir === 0 ? -self.map_size_edge : self.map_size_edge);
            let dy = (dir === 0 ? -1 : 1);
            let y2 = y;
            let lbound = self.map_size_edge;
            let ubound = (self.map_size_edge - 1) * self.map_size_edge;
            while (pos >= lbound && pos < ubound) {
                let t = self.tile_data[pos];
                if ((t & M_LAND) !== 0) {
                    break;
                }
                if (t !== M_WATER) {
                    return -1;
                }
                if (head > 0) {
                    head--;
                }
                if (head === 0 && length > 0 && length % 3 === 0) {
                    self.tile_data[pos] = tile | F_CENTER;
                } else {
                    self.tile_data[pos] = tile;
                }
                length--;
                pos += dpos;
                y2 += dy;
            }
            let rc = {x1: x - 1, x2: x + 2, y1: y - dy, y2: y2 + dy};
            if (rc.y1 > rc.y2) {
                let tmp = rc.y1;
                rc.y1 = rc.y2;
                rc.y2 = tmp;
            }
            rc.y1--;
            rc.y2 += 2;
            return rc;
        } else {
            let pos = 1 + (y + 1) * self.map_size_edge;
            let x1 = x;
            let dx = (dir === 1 ? 1 : -1);
            while (x >= 0 && x < self.map_size) {
                let t = self.tile_data[pos + x];
                if ((t & M_LAND) !== 0) {
                    break;
                }
                if (t !== M_WATER) {
                    return -1;
                }
                if (head > 0) {
                    head--;
                }
                if (head === 0 && length > 0 && length % 3 === 0) {
                    self.tile_data[pos + x] = tile | F_CENTER;
                } else {
                    self.tile_data[pos + x] = tile;
                }
                length--;
                x += dx;
            }
            let rc = {x1: x1 - dx, x2: x + dx, y1: y - 1, y2: y + 2};
            if (rc.x1 > rc.x2) {
                let tmp = rc.x1;
                rc.x1 = rc.x2;
                rc.x2 = tmp;
            }
            rc.x1--;
            rc.x2 += 2;
            return rc;
        }
    }
    function bulldoze_bridge_sub(self, x, y, t) {
        let x1 = x - 1;
        let x2 = x + 2;
        let y1 = y - 1;
        let y2 = y + 2;

        let pos = x + 1 + (y + 1) * self.map_size_edge;

        if ((self.tile_data[pos - self.map_size_edge] & ~F_CENTER) === t) {
            let pos2 = pos - self.map_size_edge;
            while ((self.tile_data[pos2] & ~F_CENTER) === t) {
                self.tile_data[pos2] = M_WATER;
                pos2 -= self.map_size_edge;
                y1--;
            }
        }
        if ((self.tile_data[pos + self.map_size_edge] & ~F_CENTER) === t) {
            let pos2 = pos + self.map_size_edge;
            while ((self.tile_data[pos2] & ~F_CENTER) === t) {
                self.tile_data[pos2] = M_WATER;
                pos2 += self.map_size_edge;
                y2++;
            }
        }
        if ((self.tile_data[pos - 1] & ~F_CENTER) === t) {
            let pos2 = pos - 1;
            while ((self.tile_data[pos2] & ~F_CENTER) === t) {
                self.tile_data[pos2] = M_WATER;
                pos2--;
                x1--;
            }
        }
        if ((self.tile_data[pos + 1] & ~F_CENTER) === t) {
            let pos2 = pos + 1;
            while ((self.tile_data[pos2] & ~F_CENTER) === t) {
                self.tile_data[pos2] = M_WATER;
                pos2++;
                x2++;
            }
        }
        self.tile_data[pos] = M_WATER;
        return {x1:x1, x2:x2, y1:y1, y2:y2};
    }
    this.build_tile_at = function(x, y, selected) {
        const pos = x + 1 + (y + 1) * this.map_size_edge;
        const tile_data_at = this.tile_data[pos];

        switch (selected.size) {
        case 1:
            switch (selected.name) {
            case 'bulldoze':
                if ((tile_data_at & 0x3F00) != 0) {
                    switch (tile_data_at) {
                    case M_GOODS_ST | F_CENTER:
                    case M_STADIUM1 | F_CENTER:
                    case M_STADIUM2 | F_CENTER:
                    case M_PORT | F_CENTER:      // 4x4
                        tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_RUBBLE);
                        tile_fill_rect(this, this.tile_sub, x, x + 2, y, y + 2, 0);
                        this.calculate_power_grid_required = true;
                        this.update_power_grid_required = true;
                        return {x1: x - 2, x2: x + 4, y1: y - 2, y2: y + 4};
                    case M_COAL_PWR | F_CENTER:
                    case M_GAS_PWR | F_CENTER:
                    case M_NUKE_PWR | F_CENTER:    // 4x4
                        tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_RUBBLE);
                        this.calculate_power_grid_required = true;
                        this.update_power_grid_required = true;
                        return {x1: x - 2, x2: x + 4, y1: y - 2, y2: y + 4};
                    case M_AIRPORT | F_CENTER:     // 6x6
                        tile_fill_rect(this, this.tile_data, x - 2, x + 4, y - 2, y + 4, M_RUBBLE);
                        tile_fill_rect(this, this.tile_sub, x, x + 2, y, y + 2, 0);
                        this.calculate_power_grid_required = true;
                        this.update_power_grid_required = true;
                        return {x1: x - 3, x2: x + 5, y1: y - 3, y2: y + 5};
                    case M_R_ZONE:
                        this.tile_sub[x + 1 + (y + 1) * this.map_size_edge] = 0;
                        return {x1: x, x2: x + 1, y1: y, y2: y + 1};
                    default:            // 3x3
                        if ((tile_data_at & F_CENTER) !== 0) {
                            tile_fill_rect(this, this.tile_data, x - 1, x + 2, y - 1, y + 2, M_RUBBLE);
                            tile_fill_rect(this, this.tile_sub, x - 1, x + 2, y - 1, y + 2, 0);
                            this.calculate_power_grid_required = true;
                            this.update_power_grid_required = true;
                            return {x1: x - 2, x2: x + 3, y1: y - 2, y2: y + 3};
                        }
                        break;
                    }
                } else if ((tile_data_at & M_LAND) === 0 && (tile_data_at & M_RDRLWR_WT) !== 0) {
                    if ((tile_data_at & M_RDRLWR_WT) === M_WIRE_WT) {
                        this.calculate_power_grid_required = true;
                        this.update_power_grid_required = true;
                    }
                    return bulldoze_bridge_sub(this, x, y, tile_data_at & M_RDRLWR_WT);
                }
                break;
            case 'road':
            case 'railroad':
            case 'wire':
                {
                    // bridge
                    let tile = (selected.name === 'road' ? M_ROAD_WT : selected.name === 'railroad' ? M_RAIL_WT : M_WIRE_WT);
                    let dir = this.get_bridge_direction(x, y, tile);
                    if (dir <= -2) {
                        dir += 3;
                    }
                    if (dir >= 0) {
                        if (selected.name === 'wire') {
                            this.calculate_power_grid_required = true;
                            this.update_power_grid_required = true;
                        }
                        return build_bridge_sub(this, x, y, dir, get_bridge_length(this, x, y, dir), tile);
                    }
                }
                break;
            case 'tree':
                this.tile_data[pos] = M_TREE;
                return {x1: x, x2: x + 1, y1: y, y2: y + 1};
            }
            break;
        case 3:
            switch (selected.name) {
            case 'land_fill':
                tile_land_fill_rect(this, x - 1, x + 2, y - 1, y + 2);
                return {x1: x - 1, x2: x + 2, y1: y - 1, y2: y + 2};
            default:
                tile_fill_rect(this, this.tile_data, x - 1, x + 2, y - 1, y + 2, selected.tile);
                this.tile_data[pos] |= F_CENTER;
                this.calc_power_supply_append(x - 1, y - 1, x + 2, y + 2);
                return {x1: x - 2, x2: x + 3, y1: y - 2, y2: y + 3};
            }
        case 4:
            switch (selected.name) {
            case 'goods_st':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_GOODS_ST);
                this.calc_power_supply_append(x - 1, y - 1, x + 3, y + 3);
                break;
            case 'stadium':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, (Math.random() < 0.5 ? M_STADIUM1 : M_STADIUM2));
                this.calc_power_supply_append(x - 1, y - 1, x + 3, y + 3);
                break;
            case 'stadium1':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_STADIUM1);
                this.calc_power_supply_append(x - 1, y - 1, x + 3, y + 3);
                break;
            case 'stadium2':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_STADIUM2);
                this.calc_power_supply_append(x - 1, y - 1, x + 3, y + 3);
                break;
            case 'sea_port':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_PORT);
                this.calc_power_supply_append(x - 1, y - 1, x + 3, y + 3);
                break;
            case 'coal_power_plant':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_COAL_PWR);
                this.calculate_power_grid_required = true;
                this.update_power_grid_required = true;
                break;
            case 'gas_power_plant':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_GAS_PWR);
                this.calculate_power_grid_required = true;
                this.update_power_grid_required = true;
                break;
            case 'nuke_power_plant':
                tile_fill_rect(this, this.tile_data, x - 1, x + 3, y - 1, y + 3, M_NUKE_PWR);
                this.calculate_power_grid_required = true;
                this.update_power_grid_required = true;
                break;
            default:
                return null;
            }
            this.tile_data[pos] |= F_CENTER;
            this.calc_power_supply_append(x - 1, y - 1, x + 3, y + 3);
            return {x1: x - 1, x2: x + 4, y1: y - 1, y2: y + 4};
        case 6:
            switch (selected.name) {
            case 'airport':
                tile_fill_rect(this, this.tile_data, x - 2, x + 4, y - 2, y + 4, M_AIRPORT);
                this.tile_data[pos] |= F_CENTER;
                this.calc_power_supply_append(x - 2, y - 2, x + 4, y + 4);
                return {x1: x - 3, x2: x + 5, y1: y - 3, y2: y + 5};
            default:
                return null;
            }
        }
        return null;
    };
    this.build_tile_range = function(x1, y1, x2, y2, selected) {
        switch (selected.name) {
        case 'bulldoze':
            if (x1 > x2) {
                let tmp = x1;
                x1 = x2;
                x2 = tmp;
            }
            if (y1 > y2) {
                let tmp = y1;
                y1 = y2;
                y2 = tmp;
            }
            for (let y = y1; y <= y2; y++) {
                for (let x = x1; x <= x2; x++) {
                    let pos = x + 1 + (y + 1) * this.map_size_edge;
                    let t = this.tile_data[pos];
                    if (this.tile_fire[pos] === 0) {
                        if ((t & M_LAND) !== 0 && (t & 0x3F00) === 0) {
                            if ((t & M_WIRE_WT) !== 0) {
                                this.calculate_power_grid_required = true;
                                this.update_power_grid_required = true;
                            }
                            this.tile_data[pos] = M_LAND;
                        }
                    }
                }
            }
            return {x1: x1 - 3, x2: x2 + 3, y1: y1 - 3, y2: y2 + 3};
        case 'road':
        case 'railroad':
        case 'wire':
            {
                let build_type;
                switch (selected.name) {
                case 'road':
                    build_type = M_ROAD_WT;
                    break;
                case 'railroad':
                    build_type = M_RAIL_WT;
                    break;
                case 'wire':
                    build_type = M_WIRE_WT;
                    break;
                }
                let dx = 0, dy = 0;
                if (x1 < x2) {
                    dx = 1;
                } else if (x1 > x2) {
                    dx = -1;
                } else if (y1 < y2) {
                    dy = 1;
                } else {
                    dy = -1;
                }
                let x = x1, y = y1;
                while (x !== x2 + dx || y !== y2 + dy) {
                    let pos = x + 1 + (y + 1) * this.map_size_edge;
                    if (this.tile_fire[pos] !== 0) {
                        break;
                    }
                    let t = this.tile_data[pos];
                    switch (t) {
                    case M_LAND:
                        this.tile_data[pos] = build_type | M_LAND;
                        break;
                    case M_RUBBLE:
                    case M_TREE:
                        if (this.auto_bulldoze) {
                            this.tile_data[pos] = build_type | M_LAND;
                        } else {
                            x2 = x - dx; // break while
                            y2 = y - dy;
                            x -= dx;
                            y -= dy;
                        }
                        break;
                    case M_ROAD:
                    case M_RAIL:
                    case M_WIRE:
                        this.tile_data[pos] |= build_type;
                        break;
                    case M_ROADRAIL:
                    case M_ROADWIRE:
                    case M_RAILWIRE:
                        break;
                    default:
                        x2 = x - dx; // break while
                        y2 = y - dy;
                        x -= dx;
                        y -= dy;
                        break;
                    }
                    x += dx;
                    y += dy;
                }
                if (x1 > x2) {
                    let tmp = x1;
                    x1 = x2;
                    x2 = tmp;
                }
                if (y1 > y2) {
                    let tmp = y1;
                    y1 = y2;
                    y2 = tmp;
                }
                switch (build_type) {
                case M_ROAD_WT:
                    return {x1: x1 - 1, x2: x2 + 2, y1: y1 - 1, y2: y2 + 2};
                case M_RAIL_WT:
                    return {x1: x1 - 3, x2: x2 + 3, y1: y1 - 3, y2: y2 + 3};
                case M_WIRE_WT:
                    this.calc_power_supply_append(x1, y1, x2 + 1, y2 + 1);
                    return {x1: x1 - 1, x2: x2 + 2, y1: y1 - 1, y2: y2 + 2};
                }
            }
        }
        return -1;
    };

    this.update_power_grid = function() {
        power_supply_left = 0;
        let power_plants = [];

        for (let y = 0; y < this.map_size; y++) {
            for (let x = 0; x < this.map_size; x++) {
                const pos = x + 1 + (y + 1) * this.map_size_edge;
                let t = this.tile_data[pos];
                if ((t & M_WIRE_WT) !== 0) {
                    this.tile_power[pos] = 1;
                    switch (t) {
                    case F_CENTER | M_COAL_PWR:
                        switch (this.ruleset) {
                        case 'tinycity':
                            power_supply_left += 1400;
                            power_plants.push(pos);
                            break;
                        case 'micropolis':
                            power_supply_left += 800;
                            power_plants.push(pos);
                            break;
                        }
                        break;
                    case F_CENTER | M_GAS_PWR:
                        power_supply_left += 1000;
                        power_plants.push(pos);
                        break;
                    case F_CENTER | M_NUKE_PWR:
                        power_supply_left += 2000;
                        power_plants.push(pos);
                        break;
                    }
                } else {
                    this.tile_power[pos] = 0;
                }
            }
        }
        this.spread_power_grid(power_plants);
        this.calculate_power_grid_required = false;
    };
    this.spread_power_grid = function(stack) {
        if (power_supply_left <= 0) {
            return;
        }
        while (stack.length > 0) {
            let pos = stack.shift();
            if (this.tile_power[pos] !== 1) {
                continue;
            }
            while (this.tile_power[pos - 1] === 1) {
                pos--;
            }
            let b1 = false;
            let b2 = false;
            for (; this.tile_power[pos] === 1; pos++) {
                if (--power_supply_left <= 0) {
                    return;
                }
                this.tile_power[pos] = 2;
                if (this.tile_power[pos - this.map_size_edge] === 1) {
                    if (!b1) {
                        stack.push(pos - this.map_size_edge);
                        b1 = true;
                    }
                } else {
                    b1 = false;
                }
                if (this.tile_power[pos + this.map_size_edge] === 1) {
                    if (!b2) {
                        stack.push(pos + this.map_size_edge);
                        b2 = true;
                    }
                } else {
                    b2 = false;
                }
            }
        }
    };
    this.get_major_problem = function() {
        if (power_supply_left < 50) {
            return 'msg_power_plant';
        }
        let blackout_found = false;
        for (let y = 0; y < this.map_size; y++) {
            for (let x = 0; x < this.map_size; x++) {
                const pos = x + 1 + (y + 1) * this.map_size_edge;
                let t = this.tile_data[pos];
                if ((t & F_CENTER) !== 0 && (t & 0x3F00) !== 0) {
                    if (this.tile_power[pos] !== 2) {
                        // if blackout occurs for a couple of months
                        if (last_blackout_x === x && last_blackout_y === y) {
                            return 'msg_blackout';
                        }
                        if (last_blackout_x === -1) {
                            last_blackout_x = x;
                            last_blackout_y = y;
                            blackout_found = true;
                            // ...break
                            x = this.map_size;
                            y = this.map_size;
                        }
                    }
                }
            }
        }
        if (!blackout_found) {
            last_blackout_x = -1;
        }
        {
            let min = this.r_demand_capacity;
            let msg = 'msg_stadium_req';
            if (min > this.c_demand_capacity) {
                min = this.c_demand_capacity;
                msg = 'msg_airport_req';
            }
            if (min > this.i_demand_capacity) {
                min = this.i_demand_capacity;
                msg = (this.ruleset === 'tinycity' ? 'msg_port_st_req' : 'msg_port_req');
            }
            if (min < 0) {
                return msg;
            }
        }
        ticks2 = (ticks2 === 0 ? 1 : 0);
        let msg = null;
        // show worst problem except 'housing cost'
        let problem = this.problems_worst[0];
        if (problem.title === 'housing_cost') {
            problem = this.problems_worst[1];
        }
        if (problem.val >= 40) {
            msg = problem.title;
        } else if (problem.val >= 20) {
            if (ticks2 === 1) {
                msg = problem.title;
            }
        }
        if (msg != null) {
            return 'msg_pb_' + msg;
        }
        return null;
    };

    function fix_center_cw(data, sub, size) {
        for (let y = 1; y < size - 2; y++) {
            for (let x = 1; x < size - 2; x++) {
                let pos = x + y * size;
                switch (data[pos]) {
                case F_CENTER | M_GOODS_ST:
                case F_CENTER | M_STADIUM1:
                case F_CENTER | M_STADIUM2:
                case F_CENTER | M_PORT:
                case F_CENTER | M_COAL_PWR:
                case F_CENTER | M_GAS_PWR:
                case F_CENTER | M_NUKE_PWR:
                case F_CENTER | M_AIRPORT:
                    sub[pos - 1] = sub[pos];
                    sub[pos] = 0;
                    data[pos - 1] |= F_CENTER;
                    data[pos] &= ~F_CENTER;
                    break;
                }
            }
        }
    }
    function fix_center_ccw(data, sub, size) {
        for (let y = 1; y < size - 2; y++) {
            for (let x = 1; x < size - 2; x++) {
                let pos = x + y * size;
                switch (data[pos]) {
                case F_CENTER | M_GOODS_ST:
                case F_CENTER | M_STADIUM1:
                case F_CENTER | M_STADIUM2:
                case F_CENTER | M_PORT:
                case F_CENTER | M_COAL_PWR:
                case F_CENTER | M_GAS_PWR:
                case F_CENTER | M_NUKE_PWR:
                case F_CENTER | M_AIRPORT:
                    sub[pos - size] = sub[pos];
                    sub[pos] = 0;
                    data[pos - size] |= F_CENTER;
                    data[pos] &= ~F_CENTER;
                    break;
                }
            }
        }
    }

    this.get_statistics = function() {
        let st = {
            r_zone: 0,
            c_zone: 0,
            i_zone: 0,
            developed: 0,
            top: 0,
            school: 0,
            hospital: 0,
            road: 0,
            rail: 0,
            wire: 0,
            woods: 0,
            clear: 0,
            water: 0,
            police_dept: 0,
            fire_dept: 0,
            station: 0,
            stadium1: 0,
            stadium2: 0,
            power_plant: 0,
            power_capa: 0,
            power_req: 0,
            gift: 0,
        };

        for (let y = 0; y < this.map_size; y++) {
            let pos = 1 + (y + 1) * this.map_size_edge;
            for (let x = 0; x < this.map_size; x++) {
                let t = this.tile_data[pos + x];
                switch (t) {
                case M_LAND:
                    st.clear++;
                    break;
                case M_TREE:
                    st.woods++;
                    break;
                case F_CENTER | M_R_ZONE:
                    st.r_zone++;
                    if (this.tile_sub[pos + x] > 0) {
                        st.developed++;
                    }
                    break;
                case F_CENTER | M_C_ZONE:
                    st.c_zone++;
                    if (this.tile_sub[pos + x] > 0) {
                        st.developed++;
                    }
                    break;
                case F_CENTER | M_I_ZONE:
                    st.i_zone++;
                    if (this.tile_sub[pos + x] > 0) {
                        st.developed++;
                    }
                    break;
                case F_CENTER | M_HOSPITAL:
                    st.hospital++;
                    break;
                case F_CENTER | M_SCHOOL:
                    st.school++;
                    break;
                case F_CENTER | M_POLICE_D:
                case F_CENTER | M_POLICE_HQ:
                    st.police_dept++;
                    break;
                case F_CENTER | M_FIRE_D:
                case F_CENTER | M_FIRE_HQ:
                    st.fire_dept++;
                    break;
                case F_CENTER | M_STATION:
                case F_CENTER | M_TERM_STN:
                case F_CENTER | M_GOODS_ST:
                    st.station++;
                    break;
                case F_CENTER | M_COAL_PWR:
                    st.power_plant++;
                    switch (this.ruleset) {
                    case 'tinycity':
                        st.power_capa += 1400;
                        break;
                    case 'micropolis':
                        st.power_capa += 800;
                        break;
                    }
                    break;
                case F_CENTER | M_GAS_PWR:
                    st.power_plant++;
                    st.power_capa += 1000;
                    break;
                case F_CENTER | M_NUKE_PWR:
                    st.power_plant++;
                    st.power_capa += 2000;
                    break;
                case F_CENTER | M_STADIUM1:
                    st.stadium1++;
                    break;
                case F_CENTER | M_STADIUM2:
                    st.stadium2++;
                    break;
                default:
                    if ((t & 0x3F00) === 0) {
                        if ((t & M_ROAD_WT) !== 0) {
                            st.road++;
                        }
                        if ((t & M_RAIL_WT) !== 0) {
                            st.rail++;
                        }
                        if ((t & M_WIRE_WT) !== 0) {
                            st.wire++;
                        }
                        if ((t & M_LAND) === 0) {
                            st.water++;
                        }
                    } else if ((t & F_CENTER) !== 0) {
                        if (t >= (M_GIFT_WT | F_CENTER)) {
                            st.gift++;
                        }
                    }
                    break;
                }
                if ((t & M_WIRE_WT) !== 0) {
                    st.power_req++;
                }
            }
        }
        st.land = this.map_size * this.map_size - st.water;

        return st;
    };
    this.get_budget = function(draft) {
        let budget = {};
        if (draft) {
            budget.tax = Math.round(this.tax_collected * 12 / this.month);
            budget.special_income = this.special_income;
            if (this.ruleset === 'tinycity') {
                budget.traffic = Math.round(this.traffic_cost * 12 / this.month);
                budget.police = Math.round(this.police_cost * 12 / this.month);
                budget.fire = Math.round(this.fire_cost * 12 / this.month);
            } else {
                budget.traffic = this.traffic_cost;
                budget.police = this.police_cost;
                budget.fire = this.fire_cost;
            }
        } else {
            budget.special_income = this.special_income;
            budget.tax     = this.tax_collected;
            budget.traffic = this.traffic_cost;
            budget.police  = this.police_cost;
            budget.fire    = this.fire_cost;
        }
        return budget;
    };
    this.update_problems = function() {
        if (this.population >= 1000) {
            let traffic_score = 0;
            let pollution_score = 0;
            let crime_score = 0;
            let housing_cost = 0;
            for (let y = 0; y < this.map_size; y++) {
                let pos = 1 + (y + 1) * this.map_size_edge;
                for (let x = 0; x < this.map_size; x++) {
                    if (this.tile_road[pos + x] > 24 && (this.tile_data[pos + x] & M_ROAD_WT) !== 0) {
                        traffic_score += this.tile_road[pos + x];
                    }
                    let t = this.tile_data[pos + x];
                    switch (t) {
                    case M_R_ZONE | F_CENTER:
                    case M_C_ZONE | F_CENTER:
                    case M_I_ZONE | F_CENTER:
                        {
                            let pos2 = (x >> 1) + (y >> 1) * this.map_size2;
                            pollution_score += this.tile_pollution[pos2] * this.tile_sub[pos + x];
                            crime_score += this.tile_crime[pos2] * this.tile_sub[pos + x];
                            if (t === M_R_ZONE | F_CENTER) {
                                if (this.tile_land_value[pos2] > 64) {
                                    housing_cost += this.tile_land_value[pos2] - 64;
                                }
                            }
                        }
                        break;
                    }
                }
            }
            this.problems.traffic_jam = Math.floor(2000 * traffic_score / (this.population + 10000));
            if (this.problems.traffic_jam > 100) {
                this.problems.traffic_jam = 100;
            }
            this.problems.pollution = Math.floor(200 * pollution_score / (this.population + 10000));
            if (this.problems.pollution > 100) {
                this.problems.pollution = 100;
            }
            this.problems.crime = Math.floor(200 * crime_score / (this.population + 10000));
            if (this.problems.crime > 100) {
                this.problems.crime = 100;
            }
            this.problems.housing_cost = Math.floor(housing_cost / (this.r_zone_count * 4 + 50));
            if (this.problems.housing_cost > 100) {
                this.problems.housing_cost = 100;
            }
            this.problems.unemployment = Math.floor(100 * (this.r_zone_pops - this.c_zone_pops - this.i_zone_pops) / (this.population + 50000));
            if (this.problems.unemployment < 0) {
                this.problems.unemployment = 0;
            } else if (this.problems.unemployment > 100) {
                this.problems.unemployment = 100;
            }
            if (this.tax_rate > 5) {
                this.problems.taxes = (this.tax_rate - 5) * 2;
                if (this.tax_rate > 10) {
                    this.problems.taxes += (this.tax_rate - 10) * 2;
                }
            }
        } else {
            this.problems.crime = 0;
            this.problems.housing_cost = 0;
            this.problems.pollution = 0;
            this.problems.taxes = 0;
            this.problems.traffic_jam = 0;
            this.problems.unemployment = 0;
        }

        this.month_gdp = 0;
        this.assessed_value = 0;
        for (let y = 0; y < this.map_size; y++) {
            let pos = 1 + (y + 1) * this.map_size_edge;
            for (let x = 0; x < this.map_size; x++) {
                switch (this.tile_data[pos + x]) {
                case M_ROAD:
                case M_ROADWIRE:
                    this.assessed_value += 10;
                    break;
                case M_RAIL:
                case M_RAILWIRE:
                    if (this.ruleset === 'tinycity') {
                        this.assessed_value += 40;
                    } else {
                        this.assessed_value += 20;
                    }
                    break;
                case M_ROADRAIL:
                    if (this.ruleset === 'tinycity') {
                        this.assessed_value += 50;
                    } else {
                        this.assessed_value += 30;
                    }
                    break;
                case M_ROAD_WT:
                    this.assessed_value += 20;
                    break;
                case M_RAIL_WT:
                    if (this.ruleset === 'tinycity') {
                        this.assessed_value += 80;
                    } else {
                        this.assessed_value += 40;
                    }
                    break;
                case M_R_ZONE | F_CENTER:
                case M_C_ZONE | F_CENTER:
                case M_I_ZONE | F_CENTER:
                    {
                        let pos2 = (x >> 1) + (y >> 1) * this.map_size2;
                        this.month_gdp += this.tile_sub[pos + x] * (this.tile_land_value[pos2] + 32) * 8;
                    }
                    this.assessed_value += 100;
                    break;
                case M_HOSPITAL | F_CENTER:
                case M_SCHOOL | F_CENTER:
                    this.assessed_value += 100;
                    break;
                case M_STATION | F_CENTER:
                    this.assessed_value += 300;
                    break;
                case M_POLICE_D | F_CENTER:
                case M_FIRE_D | F_CENTER:
                    this.assessed_value += 500;
                    break;
                case M_STADIUM1 | F_CENTER:
                case M_STADIUM2 | F_CENTER:
                case M_GOODS_ST | F_CENTER:
                    this.assessed_value += 3000;
                    break;
                case M_PORT | F_CENTER:
                    if (this.ruleset === 'tinycity') {
                        this.assessed_value += 3000;
                    } else {
                        this.assessed_value += 5000;
                    }
                    break;
                case M_AIRPORT | F_CENTER:
                    this.assessed_value += 3000;
                    break;
                case M_COAL_PWR | F_CENTER:
                    this.assessed_value += 3000;
                    break;
                case M_GAS_PWR | F_CENTER:
                    this.assessed_value += 6000;
                    break;
                case M_NUKE_PWR | F_CENTER:
                    this.assessed_value += 5000;
                    break;
                }
            }
        }

        this.problems_worst = [
            {title: 'crime', val: this.problems.crime, unit:'%'},
            {title: 'housing_cost', val: this.problems.housing_cost, unit:'%'},
            {title: 'pollution', val: this.problems.pollution, unit:'%'},
            {title: 'taxes', val: this.problems.taxes, unit:'%'},
            {title: 'traffic_jam', val: this.problems.traffic_jam, unit:'%'},
            {title: 'unemployment', val: this.problems.unemployment, unit:'%'},
        ];
        this.problems_worst.sort((a, b) => b.val - a.val);
        if (this.population >= 1000) {
            this.base_score = 1000 - this.problems.traffic_jam * 9 - this.problems.crime * 9 - this.problems.unemployment * 7
                - this.problems.pollution * 6 - this.problems.housing_cost * 2;
            if (this.base_score < 0) {
                this.base_score = 0;
            }
        } else {
            this.base_score = -1;
        }
    };
    function update_population_grid(self, data) {
        data.fill(0);
        for (let y = 0; y < self.map_size; y++) {
            let pos = 1 + (y + 1) * self.map_size_edge;
            let pos2 = (y >> 3) * map_data8_size;
            for (let x = 0; x < self.map_size; x++) {
                switch (self.tile_data[pos + x]) {
                case M_R_ZONE:
                    if (self.tile_sub[pos + x] > 0) {
                        data[pos2 + (x >> 3)] += 1;
                    }
                    break;
                case M_R_ZONE | F_CENTER:
                case M_C_ZONE | F_CENTER:
                case M_I_ZONE | F_CENTER:
                    {
                        let p = self.tile_sub[pos + x];
                        if (p > 0) {
                            data[pos2 + (x >> 3)] += 6 * p;
                        }
                    }
                    break;
                }
            }
        }
    }
    function event_condifiton(self, cond, st) {
        for (let j = 0; j < cond.length - 1; j += 2) {
            let c = cond[j];
            let d = cond[j + 1];
            let test = false;

            switch (c) {
            case 'population':
            case 'base_score':
            case 'afforestion':
                test = (self[c] >= d);
                break;
            case 'year_month':
                if (self.year * 100 + self.month >= d) {
                    test = true;
                }
                break;
            case 'random':
                if (Math.random() * 100 < d) {
                    test = true;
                }
                break;
            case 'road':
            case 'rail':
            case 'police_dept':
            case 'fire_dept':
            case 'developed':
            case 'hospitals':
            case 'schools':
            case 'stadium1':
            case 'stadium2':
            case 'gift':
                test = (st[c] >= d);
                break;
            case 'funds_ge':
                test = self.funds >= d;
                break;
            case 'funds_lt':
                test = self.funds <= d;
                break;
            case 'land_clear':
                test = st.clear <= d;
                break;
            }
            if (!test) {
                return false;
            }
        }
        return true;
    }
    this.peek_next_event = function() {
        let st = this.get_statistics();
        for (let i = 0; i < this.event_reserved.length; i++) {
            // "gift buildings" slot capacity = 4
            if (this.event_reserved[i].type === 'gift') {
                if (this.gift_buildings.length >= 4) {
                    continue;
                }
            }
            if (event_condifiton(this, this.event_reserved[i].cond, st)) {
                let e = this.event_reserved[i];
                this.event_reserved.splice(i, 1);
                return e;
            }
        }
    };

    this.rotate_cw = function() {
        this.rotate++;
        if (this.rotate > 3) {
            this.rotate = 0;
        }
        array_rotate_cw(this.tile_data, this.map_size_edge);
        array_rotate_cw(this.tile_sub, this.map_size_edge);
        fix_center_cw(this.tile_data, this.tile_sub, this.map_size_edge);
        array_rotate_cw(this.tile_fire, this.map_size_edge);
        array_rotate_cw(this.tile_power, this.map_size_edge);
        array_rotate_cw(this.tile_road, this.map_size_edge);
        array_rotate_cw(this.tile_population, this.map_size2);
        array_rotate_cw(this.tile_pollution, this.map_size2);
        array_rotate_cw(this.tile_crime, this.map_size2);
        array_rotate_cw(this.tile_land_value, this.map_size2);
        array_rotate_cw(this.tile_police_d, this.map_size2);
        array_rotate_cw(this.tile_fire_d, this.map_size2);
        let map_size8   = this.map_size >> 3;
        array_rotate_cw(this.tile_prev_pops, map_size8);
        array_rotate_cw(this.tile_grow_pops, map_size8);
    };
    this.rotate_ccw = function() {
        this.rotate--;
        if (this.rotate < 0) {
            this.rotate = 3;
        }
        array_rotate_ccw(this.tile_data, this.map_size_edge);
        array_rotate_ccw(this.tile_sub, this.map_size_edge);
        fix_center_ccw(this.tile_data, this.tile_sub, this.map_size_edge);
        array_rotate_ccw(this.tile_fire, this.map_size_edge);
        array_rotate_ccw(this.tile_power, this.map_size_edge);
        array_rotate_ccw(this.tile_road, this.map_size_edge);
        array_rotate_ccw(this.tile_population, this.map_size2);
        array_rotate_ccw(this.tile_pollution, this.map_size2);
        array_rotate_ccw(this.tile_crime, this.map_size2);
        array_rotate_ccw(this.tile_land_value, this.map_size2);
        array_rotate_ccw(this.tile_police_d, this.map_size2);
        array_rotate_ccw(this.tile_fire_d, this.map_size2);
        let map_size8   = this.map_size >> 3;
        array_rotate_ccw(this.tile_prev_pops, map_size8);
        array_rotate_ccw(this.tile_grow_pops, map_size8);
    };
    this.timer_tick_sub = function(simulate, exist_mob) {
        let updated = null;
        if (this.ticks % 100 === 10) {
            simulate.traffic();
            updated = 'traffic';
        }
        if (this.ticks % 100 === 20) {
            simulate.update_land_v();
            simulate.pollution_population();
            updated = 'cencus';
        }
        if (this.ticks % 100 === 30) {
            simulate.police_fire_port();
            updated = 'police';
        }
        if (this.ticks % 100 === 40) {
            simulate.crime();
            updated = 'crime';
        }
        if (this.ticks % 100 === 50) {
            simulate.land_value();
            updated = 'value';
        }
        if (this.ticks % 100 === 60) {
            simulate.rci_zones();
            updated = 'rci';
        }
        if (this.ticks % 200 === 70 && this.month % 2 == 0) {
            update_population_grid(this, this.tile_grow_pops);
            for (let i = 0; i < this.tile_grow_pops.length; i++) {
                this.tile_grow_pops[i] -= this.tile_prev_pops[i];
            }
            update_population_grid(this, this.tile_prev_pops);
            updated = 'pops_growth';
        }
        if (this.disaster_occurs && (this.disaster_ticks % 20) === 15) {
            simulate.update_disaster(exist_mob);
        }
        if (this.ticks % 100 === 80) {
            updated = 'disaster';
        }
        if ((this.ticks % 100) === 0) {
            simulate.update_ticks();
        }
        if ((this.ticks % 200) === 90) {
            updated = 'event';
        }
        if (this.ticks >= 200) {
            // end of month
            this.ticks = 0;
            this.month++;
            if (this.month > 12) {
                this.month = 1;
                this.year++;
                this.prev_population = this.population;
            } else {
                simulate.update_month_budget();
            }
            simulate.update_month_graph();
            simulate.update_demand();
            this.update_problems();
            updated = 'month';
        }
        if (this.disaster_ticks >= 100) {
            this.disaster_ticks = 0;
        }
        return updated;
    };
    this.timer_tick = function(simulate, exist_mob) {
        if (this.disaster_ticks >= 0) {
            this.disaster_ticks++;
            if (this.ruleset === 'micropolis') {
                this.ticks++;
            }
        } else {
            this.ticks++;
        }
        return this.timer_tick_sub(simulate, exist_mob);
    };
    this.timer_tick_fast = function(simulate) {
        this.ticks = Math.floor((this.ticks + 10) / 10) * 10;
        return this.timer_tick_sub(simulate, false);
    };
    this.game_start = function(simulate) {
        this.update_power_grid();
        simulate.traffic();
        simulate.update_land_v();
        simulate.pollution_population();
        simulate.police_fire_port();
        simulate.crime();
        simulate.land_value();
        simulate.update_demand();
        update_population_grid(this, this.tile_prev_pops);
    };

    //////////////////////////////////////////////////////////////////////

    this.to_json = function() {
        let json = {
            signature: 'TinyCity',
            version: SAVEDATA_VERSION,
            city_name: this.city_name,
            population: this.population,
            prev_population: this.prev_population || 0,
            next_population: this.next_population || 2000,
            funds: this.funds || 0,
            hidden_assets: this.hidden_assets || 0,
            rotate: this.rotate || 0,

            map_size: this.map_size || 120,
            year: this.year || 1900,
            month: this.month || 1,
            ticks: this.ticks || 0,
            disaster_ticks: this.disaster_ticks || 0,
            bank_working: this.bank_working || false,

            tornado: this.tornado || null,
            monster: this.monster || null,
            flood_time_left: this.flood_time_left || 0,

            ruleset: this.ruleset || 'micropolis',
            difficulty: this.difficulty || 'novice',

            tax_rate: this.tax_rate,
            traffic_funds: this.traffic_funds,
            traffic_funds_term: this.traffic_funds_term,
            police_funds: this.police_funds,
            police_funds_term: this.police_funds_term,
            fire_funds: this.fire_funds,
            fire_funds_term: this.fire_funds_term,

            tax_collected: this.tax_collected,
            special_income: this.special_income,
            traffic_cost : this.traffic_cost,
            police_cost: this.police_cost,
            fire_cost: this.fire_cost,

            afforestion: this.afforestion || 0,
            event_reserved: this.event_reserved || [],
            election: this.election || null,

            disaster_occurs: this.disaster_occurs || false,
        };
        let offset = this.map_size_edge;
        let length = (this.map_size_edge - 2) * this.map_size_edge;

        json.gift_buildings = [];
        for (let i = 0; i < this.gift_buildings.length; i++) {
            json.gift_buildings.push(this.gift_buildings[i].name);
        }

        json.tile_data = to_array(this.tile_data, offset, length);
        json.tile_sub  = to_array(this.tile_sub, offset, length);
        json.tile_fire = to_array(this.tile_fire, offset, length);
        json.hist_r         = to_array(this.hist_r, 0, 12 * GRAPH_YEARS);
        json.hist_c         = to_array(this.hist_c, 0, 12 * GRAPH_YEARS);
        json.hist_i         = to_array(this.hist_i, 0, 12 * GRAPH_YEARS);
        json.hist_crime     = to_array(this.hist_crime, 0, 12 * GRAPH_YEARS);
        json.hist_pollution = to_array(this.hist_pollution, 0, 12 * GRAPH_YEARS);
        json.hist_value     = to_array(this.hist_value, 0, 12 * GRAPH_YEARS);
        return json;
    };
    this.copy_from = function(source) {
        this.year = source.year;
        this.month = source.month;

        this.city_name = source.city_name;
        this.funds = source.funds;

        this.ruleset = source.ruleset;
        this.difficulty = source.difficulty;
        this.mode = source.mode;
    };
}

