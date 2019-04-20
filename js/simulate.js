'use strict';

function Simulate() {
    const ZONE_SPREAD = 32;
    const STATION_SPREAD = 12;

    const V_ROAD = 32;
    const V_WATER = 64;
    const V_BUILD = 128;

    let tile_data;
    let map_size;
    let map_size_edge;
    let map_size2;
    let city = null;
    let tile_r_zone = null;
    let tile_c_zone = null;
    let tile_i_zone = null;
    let tile_s_zone = null;
    let tile_land_v = null;
    let tile_tmp = null;
    let n_stadiums = 0;
    let n_ports = 0;
    let n_airports = 0;
    let crime_total = 0;
    let pollution_total = 0;
    let value_average = 0;
    let stn_group;
    let ticks3 = 0;
    let ticks4 = 0;
    let house_pos = null;
    let map_edge_base = null;
    let map_edge_diff = null;
    let pos_dir = null;

    this.barycenter_x = 0;
    this.barycenter_y = 0;
    this.airport_active_x = -1;
    this.airport_active_y = -1;
    this.airplane_departs = false;
    this.helicopter_departs = false;
    this.ship_route = [];
    this.ship_last_pos = -1;
    this.ufo_route = [];

    let ship_port_dir = 0;
    let is_ship_approaching_port = true;

    this.station_active_pos = -1;

    this.flood_time_left = 0;

    this.set_city = function(c) {
        city = c;
        tile_data = city.tile_data;
        map_size = city.map_size;
        map_size_edge = city.map_size_edge;
        map_size2 = city.map_size2;
        // initial center position
        this.barycenter_x = map_size2 >> 1;
        this.barycenter_y = map_size2 >> 1;

        tile_r_zone = new Uint8Array(map_size_edge * map_size_edge);
        tile_c_zone = new Uint8Array(map_size_edge * map_size_edge);
        tile_i_zone = new Uint8Array(map_size_edge * map_size_edge);
        tile_s_zone = new Uint8Array(map_size_edge * map_size_edge);
        tile_land_v = new Uint8Array(map_size2 * map_size2);  // tree(0,1...8), water(32), radio(128)
        tile_tmp    = new Uint8Array(map_size_edge * map_size_edge);
        house_pos = [
            -map_size_edge - 1,
            -map_size_edge,
            -map_size_edge + 1,
            -1,
            1,
            map_size_edge - 1,
            map_size_edge,
            map_size_edge + 1,
        ];
        map_edge_base = [
            map_size_edge + 1,
            map_size_edge + map_size,
            map_size_edge * map_size + 1,
            map_size_edge + 1,
        ];
        map_edge_diff = [
            1,
            map_size_edge,
            1,
            map_size_edge,
        ];
        pos_dir = [
            -map_size_edge,
            map_size_edge,
            -1,
            1,
        ];
    };

    function reset_traffic() {
        for (let y = 0; y < map_size; y++) {
            let pos = 1 + (y + 1) * map_size_edge;
            let mask = (city.ruleset === 'tinycity' ? M_ROAD_WT : (M_ROAD_WT | M_RAIL_WT));
            for (let x = 0; x < map_size; x++) {
                let b = (tile_data[pos + x] & mask) !== 0;
                if (!b) {
                    city.tile_road[pos + x] = 0;
                } else {
                    city.tile_road[pos + x] >>= 1;
                }
                tile_r_zone[pos + x] = b ? 0 : 255;
                tile_c_zone[pos + x] = b ? 0 : 255;
                tile_i_zone[pos + x] = b ? 0 : 255;
            }
        }
    }

    function spread_zone_effect(tile, stack) {
        while (stack.length > 0) {
            let pos = stack.shift();
            if (tile[pos] === 255) {
                continue;
            }
            let lv = tile[pos];
            let b1 = false;
            let b2 = false;
            let pos0 = pos;
            let lv0 = lv;

            tile[pos] = 0;

            while (tile[pos] < lv) {
                let pos2;
                tile[pos] = lv;
                pos2 = pos - map_size_edge;
                if (tile[pos2] < lv) {
                    if (!b1 && lv > 1) {
                        tile[pos2] = lv - 1;
                        stack.push(pos2);
                        b1 = true;
                    }
                } else {
                    b1 = false;
                }
                pos2 = pos + map_size_edge;
                if (tile[pos2] < lv) {
                    if (!b2 && lv > 1) {
                        tile[pos2] = lv - 1;
                        stack.push(pos2);
                        b2 = true;
                    }
                } else {
                    b2 = false;
                }
                pos--;
                lv--;
            }

            b1 = false;
            b2 = false;
            pos = pos0 + 1;
            lv = lv0 - 1;
            while (tile[pos] < lv) {
                let pos2;
                tile[pos] = lv;
                pos2 = pos - map_size_edge;
                if (tile[pos2] < lv) {
                    if (!b1 && lv > 1) {
                        tile[pos2] = lv - 1;
                        stack.push(pos2);
                        b1 = true;
                    }
                } else {
                    b1 = false;
                }
                pos2 = pos + map_size_edge;
                if (tile[pos2] < lv) {
                    if (!b2 && lv > 1) {
                        tile[pos2] = lv - 1;
                        stack.push(pos2);
                        b2 = true;
                    }
                } else {
                    b2 = false;
                }
                pos++;
                lv--;
            }
        }
    }
    function update_zone_effect_edge(stack, tile, p, diff) {
        if (tile[p] < ZONE_SPREAD) {
            tile[p] = ZONE_SPREAD;
            stack.push(p);
        } else {
            if (tile[p - diff] < ZONE_SPREAD) {
                tile[p - diff] = ZONE_SPREAD;
                stack.push(p - diff);
            }
            if (tile[p + diff] < ZONE_SPREAD) {
                tile[p + diff] = ZONE_SPREAD;
                stack.push(p + diff);
            }
        }
    }
    function update_zone_effect_sub(stack, tile, pos, spread) {
        update_zone_effect_edge(stack, tile, pos - map_size_edge * 2, 1, spread);
        update_zone_effect_edge(stack, tile, pos + map_size_edge * 2, 1, spread);
        update_zone_effect_edge(stack, tile, pos - 2, map_size_edge, spread);
        update_zone_effect_edge(stack, tile, pos + 2, map_size_edge, spread);
        spread_zone_effect(tile, stack);
    }
    function update_zone_effect(self) {
        let stack = [];
        let r_cnt = 0, c_cnt = 0, i_cnt = 0;
        let spread = Math.floor(ZONE_SPREAD * city.traffic_funds_term / 100);
        if (spread < 1) {
            spread = 1;
        }

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                let tile = null;
                switch (city.tile_data[pos]) {
                case M_R_ZONE | F_CENTER:
                    r_cnt++;
                    if (r_cnt >= 3) {
                        r_cnt = 0;
                    }
                    if ((city.r_zone_count < 3 || ticks3 === r_cnt) && city.tile_power[pos] === 2) {
                        tile = tile_r_zone;
                    }
                    break;
                case M_C_ZONE | F_CENTER:
                    c_cnt++;
                    if (c_cnt >= 3) {
                        c_cnt = 0;
                    }
                    if ((city.c_zone_count < 3 || ticks3 === c_cnt) && city.tile_power[pos] === 2) {
                        tile = tile_c_zone;
                    }
                    break;
                case M_I_ZONE | F_CENTER:
                    i_cnt++;
                    if (i_cnt >= 3) {
                        i_cnt = 0;
                    }
                    if ((city.i_zone_count < 3 || ticks3 === i_cnt) && city.tile_power[pos] === 2) {
                        tile = tile_i_zone;
                    }
                    break;
                case M_TERM_STN | F_CENTER:
                    if (city.ruleset === 'micropolis') {
                        self.station_active_pos = pos;
                    }
                    break;
                }
                if (tile != null) {
                    update_zone_effect_sub(stack, tile, pos, spread);
                }
            }
        }
    }
    function fill_zone(pos, tile, kind) {
        let stack = [pos];

        while (stack.length > 0) {
            let pos = stack.shift();
            if (tile[pos] !== 0) {
                continue;
            }
            let pos0 = pos;
            while (tile[pos] === 0) {
                let pos2;
                tile[pos] = kind;
                pos2 = pos - map_size_edge;
                if (tile[pos2] === 0) {
                    stack.push(pos2);
                }
                pos2 = pos + map_size_edge;
                if (tile[pos2] === 0) {
                    stack.push(pos2);
                }
                pos--;
            }
            pos = pos0 + 1;
            while (tile[pos] === 0) {
                let pos2;
                tile[pos] = kind;
                pos2 = pos - map_size_edge;
                if (tile[pos2] === 0) {
                    stack.push(pos2);
                }
                pos2 = pos + map_size_edge;
                if (tile[pos2] === 0) {
                    stack.push(pos2);
                }
                pos++;
            }
        }
    }
    function make_station_group(self) {
        stn_group = {};

        for (let i = 0; i < map_size_edge * map_size_edge; i++) {
            let b = city.tile_data[i];
            tile_s_zone[i] = ((b & M_RAIL_WT) !== 0) ? 0 : 255;
        }

        let kind = 1;
        let stn_list = [];

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                let t = city.tile_data[pos];
                switch (t) {
                case M_STATION | F_CENTER:
                case M_TERM_STN | F_CENTER:
                case M_GOODS_ST | F_CENTER:
                    if (city.tile_power[pos] === 2) {
                        if (tile_s_zone[pos] === 0) {
                            fill_zone(pos, tile_s_zone, kind);
                            kind++;
                            if (kind >= 255) {
                                kind = 1;
                            }
                        }
                        let k = tile_s_zone[pos];
                        let sg = stn_group[k];
                        if (!sg) {
                            sg = {
                                outer: false,
                                r_zone: false, c_zone: false,
                                left: x, right: x, top: y, bottom: y,
                                pops: 0, users: 0,
                                list: [],
                            };
                            stn_group[k] = sg;
                        } else {
                            if (sg.left > x) {
                                sg.left = x;
                            }
                            if (sg.right < x) {
                                sg.right = x;
                            }
                            if (sg.top > y) {
                                sg.top = y;
                            }
                            if (sg.bottom < y) {
                                sg.bottom = y;
                            }
                        }
                        if (t !== (M_GOODS_ST | F_CENTER)) {
                            if (!sg.r_zone) {
                                sg.r_zone = is_traffic_connected(tile_r_zone, null, pos, 3);
                            }
                            if (!sg.c_zone) {
                                sg.c_zone = is_traffic_connected(tile_c_zone, null, pos, 3);
                            }
                            sg.list.push(pos);
                            stn_list.push(pos);
                        }
                    }
                    break;
                }
            }
        }
        for (let i = 0; i < 4; i++) {
            let base = map_edge_base[i];
            let diff = map_edge_diff[i];
            for (let j = 0; j < map_size; j++) {
                let k = tile_s_zone[base + diff * j];
                if (k > 0 && k < 255) {
                    stn_group[k].outer = true;
                }
            }
        }
        if (stn_list.length > 0) {
            let pos = choice_random(stn_list);
            self.station_active_pos = pos;
        } else {
            self.station_active_pos = -1;
        }
    }
    function station_effect_area() {
        for (let i = 0; i < map_size_edge * map_size_edge; i++) {
            let b = city.tile_data[i];
            tile_tmp[i] = ((b & M_ROAD_WT) !== 0) ? 0 : 255;

            if (b !== (M_STATION | F_CENTER) && b !== (M_TERM_STN | F_CENTER) && b !== (M_GOODS_ST | F_CENTER)) {
                tile_s_zone[i] = 0;
            }
        }
        let stack = [];
        for (let key in stn_group) {
            let k = parseInt(key);
            let sg = stn_group[key];
            sg.pops = Math.sqrt((sg.right - sg.left) + (sg.bottom - sg.top)) / 96;
            if (sg.pops > 1) {
                sg.pops = 1;
            }
            for (let i = 0; i < sg.list.length; i++) {
                let pos = sg.list[i];
                update_zone_effect_sub(stack, tile_tmp, pos, STATION_SPREAD);
                for (let i = map_size_edge; i < map_size_edge * map_size; i++) {
                    if (tile_tmp[i] < 255 && tile_tmp[i] > 0) {
                        tile_s_zone[i] = k;
                        tile_tmp[i] = 0;
                    }
                }
            }
        }
    }
    function car_trace_begin_pos(pos, tile, size, cutoff) {
        let max = 0;
        let pos_max = 0;
        let b1, b2, d;

        switch (size) {
        case 3:
            b1 = -2;
            b2 = 2;
            d = -1;
            break;
        case 4:
            b1 = -2;
            b2 = 3;
            d = -1;
            break;
        case 6:
            b1 = -3;
            b2 = 4;
            d = -2;
            break;
        }
        for (let i = 0; i < size; i++) {
            let p = pos + map_size_edge * b1 + i + d;
            if (tile[p] < 255 && max < tile[p]) {
                max = tile[p];
                pos_max = p;
            }
            p = pos + map_size_edge * b2 - i + d;
            if (tile[p] < 255 && max < tile[p]) {
                max = tile[p];
                pos_max = p;
            }
            p = pos + b1 + (i + d) * map_size_edge;
            if (tile[p] < 255 && max < tile[p]) {
                max = tile[p];
                pos_max = p;
            }
            p = pos + b2 + (i + d) * map_size_edge;
            if (tile[p] < 255 && max < tile[p]) {
                max = tile[p];
                pos_max = p;
            }
        }
        return (max < cutoff ? pos_max : -1);
    }
    function car_trace_sub(pos, tile, level) {
        level = Math.round(level);
        if (level < 1) {
            return;
        }
        let v = tile[pos] + 1;
        for (;;) {
            let lv = city.tile_road[pos] + level;
            if (lv > 255) {
                lv = 255;
            }
            city.tile_road[pos] = lv;
            if (tile[pos - map_size_edge] === v) {
                pos -= map_size_edge;
                v++;
            } else if (tile[pos + map_size_edge] === v) {
                pos += map_size_edge;
                v++;
            } else if (tile[pos - 1] === v) {
                pos -= 1;
                v++;
            } else if (tile[pos + 1] === v) {
                pos += 1;
                v++;
            } else {
                return;
            }
        }
    }
    function get_rail_line_pops(p, users) {
        if (tile_s_zone[p] > 0) {
            let sg = stn_group[tile_s_zone[p]];
            sg.users += users;
            return 1 - sg.pops;
        }
        return 1;
    }
    function update_car_trace(self) {
        let cutoff = 26;

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                switch (city.tile_data[pos]) {
                case M_R_ZONE | F_CENTER:
                    if (city.tile_sub[pos] >= 3) {
                        let p = car_trace_begin_pos(pos, tile_c_zone, 3, cutoff);
                        if (p > 0) {
                            car_trace_sub(p, tile_c_zone, (city.tile_sub[pos] - 2) * get_rail_line_pops(p, city.tile_sub[pos]));
                        }
                        car_trace_begin_pos(pos, tile_i_zone, 3, cutoff);
                        if (p > 0) {
                            car_trace_sub(p, tile_i_zone, (city.tile_sub[pos] - 2) * get_rail_line_pops(p, city.tile_sub[pos]));
                        }
                    }
                    break;
                case M_C_ZONE | F_CENTER:
                    if (city.tile_sub[pos] >= 3) {
                        let p = car_trace_begin_pos(pos, tile_r_zone, 3, cutoff);
                        if (p > 0) {
                            car_trace_sub(p, tile_r_zone, (city.tile_sub[pos] - 2) * get_rail_line_pops(p, city.tile_sub[pos]));
                        }
                    }
                    break;
                case M_I_ZONE | F_CENTER:
                    if (city.tile_sub[pos] >= 3) {
                        let p = car_trace_begin_pos(pos, tile_r_zone, 3, cutoff);
                        if (p > 0) {
                            car_trace_sub(p, tile_r_zone, (city.tile_sub[pos] - 2) * get_rail_line_pops(p, city.tile_sub[pos]));
                        }
                    }
                    break;
                case M_STADIUM1 | F_CENTER:
                case M_STADIUM2 | F_CENTER:
                    if (city.tile_sub[pos] > 0) {
                        let p = car_trace_begin_pos(pos, tile_r_zone, 4, 256);
                        if (p > 0) {
                            car_trace_sub(p, tile_r_zone, city.tile_sub[pos] * get_rail_line_pops(p, city.tile_sub[pos]));
                        }
                    }
                    break;
                case M_PORT | F_CENTER:
                case M_GOODS_ST | F_CENTER:
                    if (city.tile_sub[pos] > 0) {
                        let p = car_trace_begin_pos(pos, tile_i_zone, 4, 256);
                        if (p > 0) {
                            car_trace_sub(p, tile_i_zone, city.tile_sub[pos] >> 1);
                        }
                    }
                    break;
                case M_AIRPORT | F_CENTER:
                    if (city.tile_sub[pos] > 0) {
                        if (self.airport_active_x >= 0) {
                            if (self.airport_active_x === x && self.airport_active_y === y) {
                                if (!self.airplane_departs) {
                                    self.airplane_departs = true;
                                } else {
                                    self.helicopter_departs = true;
                                }
                            }
                        } else {
                            self.airport_active_x = x;
                            self.airport_active_y = y;
                        }
                        let p = car_trace_begin_pos(pos, tile_c_zone, 6, 256);
                        if (p > 0) {
                            car_trace_sub(p, tile_c_zone, city.tile_sub[pos] * get_rail_line_pops(p, city.tile_sub[pos]));
                        }
                    } else {
                        if (self.airport_active_x >= 0) {
                            if (self.airport_active_x === x && self.airport_active_y === y) {
                                self.airport_active_x = -1;
                                self.airport_active_y = -1;
                            }
                        }
                    }
                    break;
                }
            }
        }
        for (let k in stn_group) {
            let sg = stn_group[k];
            let user = Math.floor(sg.users * sg.pops / sg.list.length);
            if (user > 250) {
                user = 250;
            }
            for (let i = 0; i < sg.list.length; i++) {
                city.tile_sub[sg.list[i]] = sg.users;
            }
        }
    }
    function railroad_set_zero() {
        for (let y = 0; y < map_size; y++) {
            let pos = 1 + (y + 1) * map_size_edge;
            for (let x = 0; x < map_size; x++) {
                if ((city.tile_data[pos + x] & M_ROAD_WT) === 0) {
                    city.tile_road[pos + x] = 0;
                }
            }
        }
    }
    this.traffic = function() {
        reset_traffic();
        update_zone_effect(this);
        if (city.ruleset === 'tinycity') {
            make_station_group(this);
            station_effect_area();
        }
        update_car_trace(this);
    };
    function is_traffic_connected(tile, key, pos, size) {
        let b1, b2, d;
        switch (size) {
        case 3:
            b1 = -2;
            b2 = 2;
            d = -1;
            break;
        case 4:
            b1 = -2;
            b2 = 3;
            d = -1;
            break;
        case 6:
            b1 = -3;
            b2 = 4;
            d = -2;
            break;
        }
        for (let i = 0; i < size; i++) {
            let t = tile[pos + map_size_edge * b1 + i + d];
            if (t > 0 && t < 255)
                return true;
            t = tile[pos + map_size_edge * b2 + i + d];
            if (t > 0 && t < 255)
                return true;
            t = tile[pos + b1 + (i + d) * map_size_edge];
            if (t > 0 && t < 255)
                return true;
            t = tile[pos + b2 + (i + d) * map_size_edge];
            if (t > 0 && t < 255)
                return true;

            if (key != null) {
                t = tile_s_zone[pos + map_size_edge * b1 + i + d];
                if (t > 0 && t < 255) {
                    if (stn_group[t][key])
                        return true;
                }
                t = tile_s_zone[pos + map_size_edge * b2 + i + d];
                if (t > 0 && t < 255) {
                    if (stn_group[t][key])
                        return true;
                }
                t = tile_s_zone[pos + b1 + (i + d) * map_size_edge];
                if (t > 0 && t < 255) {
                    if (stn_group[t][key])
                        return true;
                }
                t = tile_s_zone[pos + b2 + (i + d) * map_size_edge];
                if (t > 0 && t < 255) {
                    if (stn_group[t][key])
                        return true;
                }
            }
        }
        return false;
    }
    function inc_r_zone(pos) {
        if (city.tile_sub[pos] > 0) {
            if (city.tile_sub[pos] < 5) {
                city.tile_sub[pos]++;
            }
        } else {
            let empty = true;
            for (let i = 0; i < 8; i++) {
                if (city.tile_sub[pos + house_pos[i]] > 0) {
                    empty = false;
                    break;
                }
            }
            // R zone -> school or hospital
            if (empty && Math.random() < 0.0625) {
                let t = (Math.random() < 0.5 ? M_HOSPITAL : M_SCHOOL);
                city.tile_data[pos] = t | F_CENTER;
                for (let i = 0; i < 8; i++) {
                    city.tile_data[pos + house_pos[i]] = t;
                }
                return;
            }

            let dir = Math.floor(Math.random() * 8);
            for (let i = (dir + 1) & 7; i != dir; i = (i + 1) & 7) {
                let p = pos + house_pos[i];
                if (city.tile_sub[p] === 0) {
                    city.tile_sub[p] = 1;
                    return;
                }
            }
            for (let i = 0; i < 8; i++) {
                city.tile_sub[pos + house_pos[i]] = 0;
            }
            city.tile_sub[pos] = 2;
        }
    }
    function dec_r_zone(pos) {
        if (city.tile_sub[pos] === 0) {
            let dir = Math.floor(Math.random() * 8);
            for (let i = (dir + 1) & 7; i != dir; i = (i + 1) & 7) {
                let p = pos + house_pos[i];
                if (city.tile_sub[p] === 1) {
                    city.tile_sub[p] = 0;
                    return;
                }
            }
        } else if (city.tile_sub[pos] === 2) {
            for (let i = 0; i < 8; i++) {
                city.tile_sub[pos + house_pos[i]] = 1;
            }
            city.tile_sub[pos] = 0;
        } else {
            city.tile_sub[pos]--;
        }
    }
    function population_at(x, y) {
        x >>= 1;
        y >>= 1;
        let pops = city.tile_population[x + y * map_size2];
        if (x > 0) {
            pops += city.tile_population[x - 1 + y * map_size2];
        }
        if (x < map_size2 - 1) {
            pops += city.tile_population[x + 1 + y * map_size2];
        }
        if (y > 0) {
            pops += city.tile_population[x + (y - 1) * map_size2];
        }
        if (y < map_size2 - 1) {
            pops += city.tile_population[x + (y + 1) * map_size2];
        }
        return pops;
    }
    function increase_rc_p(x, y, demand) {
        let pos = (x >> 1) + (y >> 1) * map_size2;
        let v = city.tile_land_value[pos];
        let up = (v < 64 ? 0.25 : 0.25 - (v - 64) / 64);
        let down = -v / 96;
        if (demand > up) {
            return 1;
        } else if (demand < down) {
            return -1;
        } else {
            return 0;
        }
    }
    function increase_i_p(demand) {
        if (demand > 0) {
            return 1;
        } else if (demand < -0.125) {
            return -1;
        } else {
            return 0;
        }
    }
    this.rci_zones = function() {
        let cnt = 0;
        let rci_cnt = 0;
        city.r_zone_count = 0;
        city.c_zone_count = 0;
        city.i_zone_count = 0;
        city.r_zone_pops = 0;
        city.c_zone_pops = 0;
        city.i_zone_pops = 0;
        this.barycenter_x = 0;
        this.barycenter_y = 0;

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                switch (city.tile_data[pos]) {
                case M_R_ZONE | F_CENTER:
                    cnt++;
                    if (cnt >= 4) {
                        cnt = 0;
                    }
                    // small houses grows fast
                    if (cnt === ticks4 || city.tile_sub[pos] === 0) {
                        let inc = increase_rc_p(x, y, city.r_demand - city.tile_sub[pos] * 0.0625);
                        if (inc > 0 && city.tile_power[pos] === 2 && city.tile_fire[pos] === 0 && is_traffic_connected(tile_c_zone, 'c_zone', pos, 3)) {
                            inc_r_zone(pos);
                        } else if (inc < 0) {
                            dec_r_zone(pos);
                        }
                    }
                    if (city.tile_sub[pos] === 0) {
                        for (let i = 0; i < 8; i++) {
                            if (city.tile_sub[pos + house_pos[i]] !== 0) {
                                city.r_zone_pops += 20;
                            }
                        }
                    } else {
                        city.r_zone_pops += city.tile_sub[pos] * 160;
                    }
                    city.r_zone_count++;
                    this.barycenter_x += x;
                    this.barycenter_y += y;
                    rci_cnt++;
                    break;
                case M_HOSPITAL:
                case M_SCHOOL:
                    city.r_zone_pops += 160;
                    break;
                case M_C_ZONE | F_CENTER:
                    cnt++;
                    if (cnt >= 4) {
                        cnt = 0;
                    }
                    if (cnt === ticks4) {
                        let inc = increase_rc_p(x, y, city.c_demand - city.tile_sub[pos] * 0.0625);
                        if (inc > 0 && city.tile_power[pos] === 2 && city.tile_fire[pos] === 0 && is_traffic_connected(tile_r_zone, 'r_zone', pos, 3)) {
                            if (city.tile_sub[pos] < 5) {
                                city.tile_sub[pos]++;
                            }
                        } else if (inc < 0) {
                            if (city.tile_sub[pos] > 0) {
                                city.tile_sub[pos]--;
                            }
                        }
                    }
                    city.c_zone_pops += city.tile_sub[pos] * 160;
                    city.c_zone_count++;
                    this.barycenter_x += x;
                    this.barycenter_y += y;
                    rci_cnt++;
                    break;
                case M_I_ZONE | F_CENTER:
                    cnt++;
                    if (cnt >= 4) {
                        cnt = 0;
                    }
                    if (cnt === ticks4) {
                        let inc = increase_i_p(city.i_demand - city.tile_sub[pos] * 0.0625);
                        if (inc > 0 && city.tile_power[pos] === 2 && city.tile_fire[pos] === 0 && is_traffic_connected(tile_r_zone, 'r_zone', pos, 3)) {
                            if (city.tile_sub[pos] < 4) {
                                city.tile_sub[pos]++;
                            }
                        } else if (inc < 0) {
                            if (city.tile_sub[pos] > 0) {
                                city.tile_sub[pos]--;
                            }
                        }
                    }
                    city.i_zone_pops += city.tile_sub[pos] * 160;
                    city.i_zone_count++;
                    this.barycenter_x += x;
                    this.barycenter_y += y;
                    rci_cnt++;
                    break;
                }
            }
        }
        city.population = city.r_zone_pops + city.c_zone_pops + city.i_zone_pops;
        if (rci_cnt > 0) {
            this.barycenter_x = Math.floor(this.barycenter_x / rci_cnt / 2);
            this.barycenter_y = Math.floor(this.barycenter_y / rci_cnt / 2);
        } else {
            this.barycenter_x = map_size2 >> 1;
            this.barycenter_y = map_size2 >> 1;
        }
    };
    function diffusion_sub(tile, cx, cy, level, diff) {
        cx >>= 1;
        cy >>= 1;
        let size = level >> diff;
        let x1 = cx - size;
        let y1 = cy - size;
        let x2 = cx + size + 1;
        let y2 = cy + size + 1;
        if (x1 < 0) x1 = 0;
        if (y1 < 0) y1 = 0;
        if (x2 > map_size2) x2 = map_size2;
        if (y2 > map_size2) y2 = map_size2;

        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                let lv = level - ((Math.abs(x - cx) + Math.abs(y - cy)) << diff);
                if (lv > 0) {
                    let p = x + y * map_size2;
                    let pol = tile[p] + lv;
                    if (pol > 255) pol = 255;
                    tile[p] = pol;
                }
            }
        }
    }
    function diffusion_road_sub(tile, cx, cy, level, diff) {
        cx >>= 1;
        cy >>= 1;

        let pos = cx + cy * map_size2;
        let stack = [pos];
        let y1 = map_size2;
        let y2 = map_size2 * (map_size2 - 1);
        tile_tmp.fill(0);
        tile_tmp[pos] = level;

        while (stack.length > 0) {
            pos = stack.shift();
            let lv0 = tile_tmp[pos];
            tile_tmp[pos] = 0;
            let x1 = Math.floor(pos / map_size2) * map_size2;
            let x2 = x1 + map_size2;
            let pos2;
            let lv = lv0;
            let x = pos;
            while (x >= x1 && tile_tmp[x] < lv) {
                tile_tmp[x] = lv;
                if ((tile_land_v[x] & V_ROAD) !== 0) {
                    lv -= diff >> 2;
                } else {
                    lv -= diff;
                }
                if (lv <= 0) {
                    break;
                }
                pos2 = x - map_size2;
                if (x >= y1) {
                    if (tile_tmp[pos2] < lv) {
                        tile_tmp[pos2] = lv;
                        stack.push(pos2);
                    }
                }
                pos2 = x + map_size2;
                if (x < y2) {
                    if (tile_tmp[pos2] < lv) {
                        tile_tmp[pos2] = lv;
                        stack.push(pos2);
                    }
                }
                x--;
            }
            if ((tile_land_v[pos] & V_ROAD) !== 0) {
                lv = lv0 - (diff >> 2);
            } else {
                lv = lv0 - diff;
            }
            x = pos + 1;
            while (x < x2 && tile_tmp[x] < lv) {
                tile_tmp[x] = lv;
                if ((tile_land_v[x] & V_ROAD) !== 0) {
                    lv -= diff >> 2;
                } else {
                    lv -= diff;
                }
                if (lv <= 0) {
                    break;
                }
                pos2 = x - map_size2;
                if (x >= y1) {
                    if (tile_tmp[pos2] < lv) {
                        tile_tmp[pos2] = lv;
                        stack.push(pos2);
                    }
                }
                pos2 = x + map_size2;
                if (x < y2) {
                    if (tile_tmp[pos2] < lv) {
                        tile_tmp[pos2] = lv;
                        stack.push(pos2);
                    }
                }
                x++;
            }
        }
        let size2 = map_size2 * map_size2;
        for (let i = 0; i < size2; i++) {
            let v = tile[i] + tile_tmp[i];
            if (v > 255) {
                v = 255;
            }
            tile[i] = v;
        }
    }
    this.pollution_population = function() {
        city.tile_pollution.fill(0);
        city.tile_population.fill(0);
        pollution_total = 0;

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;

                switch (city.tile_data[pos]) {
                case M_ROAD:
                case M_ROAD_WT:
                    {
                        let lv = city.tile_road[pos];
                        if (lv > 8) {
                            let pollution = lv > 24 ? 16 : 8;
                            diffusion_sub(city.tile_pollution, x, y, pollution, 3);
                            pollution_total += pollution;
                        }
                    }
                    break;
                case M_I_ZONE | F_CENTER:
                    {
                        let lv = city.tile_sub[pos];
                        let tree = tile_land_v[(y >> 1) * map_size2 + (x >> 1)] & 31; 
                        let pollution = ((34 - tree) * lv) >> 2;
                        diffusion_sub(city.tile_pollution, x, y, pollution, 3);
                        pollution_total += pollution;
                    }
                    // fall through
                case M_R_ZONE | F_CENTER:
                case M_C_ZONE | F_CENTER:
                    {
                        let lv = city.tile_sub[pos];
                        diffusion_sub(city.tile_population, x, y, lv * 16, 4);
                    }
                    break;
                case M_R_ZONE:
                    if (city.tile_sub[pos] > 0) {
                        diffusion_sub(city.tile_population, x, y, 4, 4);
                    }
                    break;
                case M_HOSPITAL:
                case M_SCHOOL:
                    diffusion_sub(city.tile_population, x, y, 16, 4);
                    break;
                case M_COAL_PWR | F_CENTER:
                    diffusion_sub(city.tile_pollution, x, y, 64, 3);
                    pollution_total += 64;
                    break;
                case M_GAS_PWR | F_CENTER:
                    diffusion_sub(city.tile_pollution, x, y, 36, 3);
                    pollution_total += 36;
                    break;
                case M_AIRPORT | F_CENTER:
                    diffusion_sub(city.tile_pollution, x, y, 96, 3);
                    pollution_total += 96;
                    break;
                }
                if ((city.tile_fire[pos] & MF_RADIO) !== 0) {
                    diffusion_sub(city.tile_pollution, x, y, 12, 2);
                    pollution_total += 12;
                }
            }
        }
    };
    function set_sea_area() {
        tile_tmp.fill(0);
        let src = city.tile_data;
        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = 1 + x + (1 + y) * map_size_edge;
                let t = src[pos];
                let b = false;
                if ((src[pos - map_size_edge - 1] & M_LAND) !== 0) {
                    b = true;
                } else if ((src[pos - map_size_edge + 1] & M_LAND) !== 0) {
                    b = true;
                } else if ((src[pos + map_size_edge - 1] & M_LAND) !== 0) {
                    b = true;
                } else if ((src[pos + map_size_edge + 1] & M_LAND) !== 0) {
                    b = true;
                } else if ((t & M_LAND) !== 0) {
                    b = true;
                } else if (t === (M_ROAD_WT | F_CENTER) || t === (M_WIRE_WT | F_CENTER)) {
                    b = true;
                } else if (t === M_RAIL_WT) {
                    for (let i = 0; i < 4; i++) {
                        if (src[pos + pos_dir[i]] === (M_RAIL_WT | F_CENTER)) {
                            b = true;
                            break;
                        }
                    }
                }
                if (b) tile_tmp[pos] = 255;
            }
        }
        let map_size_1 = map_size + 1;
        for (let i = 0; i < map_size_edge; i++) {
            tile_tmp[i] = 255;
            tile_tmp[i + map_size_edge * map_size_1] = 255;
        }
        for (let i = 1; i < map_size_1; i++) {
            tile_tmp[i * map_size_edge] = 255;
            tile_tmp[i * map_size_edge + map_size_1] = 255;
        }
    }
    function outer_sea_connect(ship_dest) {
        let stack = [];

        for (let i = 0; i < 4; i++) {
            let base = map_edge_base[i];
            let diff = map_edge_diff[i];
            let begin = -1;

            for (let j = 0; j < map_size; j++) {
                if (tile_tmp[base + diff * j] === 0) {
                    if (begin < 0) {
                        begin = j;
                    }
                } else {
                    if (begin >= 0) {
                        let p = base + diff * ((begin + j) >> 1);
                        ship_dest.push([p, i * 2]);
                        begin = -1;
                    }
                }
            }
            if (begin >= 0) {
                let p = base + diff * ((begin + map_size) >> 1);
                ship_dest.push([p, i * 2]);
            }
        }
    }
    function is_connected_port(pos, port_dest) {
        let x = pos % map_size_edge;
        let y = Math.floor(pos / map_size_edge);
        if (x > 5) {
            let p = pos - 4;
            if (tile_tmp[p] === 0) { port_dest.push([p, 2]); return true; }
        }
        if (x < map_size - 5) {
            let p = pos + 5;
            if (tile_tmp[p] === 0) { port_dest.push([p, 6]); return true; }
        }
        if (y > 5) {
            let p = pos - map_size_edge * 4;
            if (tile_tmp[p] === 0) { port_dest.push([p, 4]); return true; }
        }
        if (y < map_size - 5) {
            let p = pos + map_size_edge * 5;
            if (tile_tmp[p] === 0) { port_dest.push([p, 0]); return true; }
        }
        return false;
    }
    function trace_ship_route(self, p, dest_port) {
        let v = tile_tmp[p];
        if (v === 0 || v === 255) {
            return false;
        }
        let rt = self.ship_route;
        if (!dest_port) {
            rt.push(ship_port_dir | 16);
        }
        while (v < 253) {
            let d = -1;
            let q = -1;
            if (tile_tmp[(q = p - map_size_edge - 1)] === v + 2) {
                d = 3;
                v += 2;
            } else if (tile_tmp[(q = p - map_size_edge + 1)] === v + 2) {
                d = 5;
                v += 2;
            } else if (tile_tmp[(q = p + map_size_edge - 1)] === v + 2) {
                d = 1;
                v += 2;
            } else if (tile_tmp[(q = p + map_size_edge + 1)] === v + 2) {
                d = 7;
                v += 2;
            } else if (tile_tmp[(q = p - map_size_edge)] === v + 1) {
                d = 4;
                v++;
            } else if (tile_tmp[(q = p + map_size_edge)] === v + 1) {
                d = 0;
                v++;
            } else if (tile_tmp[(q = p - 1)] === v + 1) {
                d = 2;
                v++;
            } else if (tile_tmp[(q = p + 1)] === v + 1) {
                d = 6;
                v++;
            }
            if (d >= 0) {
                p = q;
                rt.push(d);
            } else {
                break;
            }
        }
        if (dest_port) {
            rt.push((ship_port_dir ^ 4) | 16);
            rt.push(32);
        } else {
            rt.push(null);
        }
        return true;
    }
    this.police_fire_port = function() {
        let police_power = Math.floor(24 * city.police_funds_term / 100);
        let fire_power = Math.floor(24 * city.fire_funds_term / 100);
        let ship_dest = [];
        let port_dest = [];

        city.tile_police_d.fill(0);
        city.tile_fire_d.fill(0);

        set_sea_area();
        outer_sea_connect(ship_dest);

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                switch (city.tile_data[pos]) {
                case M_STADIUM1 | F_CENTER:
                case M_STADIUM2 | F_CENTER:
                    if (city.tile_power[pos] === 2 && is_traffic_connected(tile_r_zone, 'r_zone', pos, 4)) {
                        n_stadiums++;
                        city.tile_sub[pos] = 1;
                    } else {
                        city.tile_sub[pos] = 0;
                    }
                    break;
                case M_PORT | F_CENTER:
                    city.tile_sub[pos] = 0;
                    if (city.tile_power[pos] === 2 && is_traffic_connected(tile_i_zone, null, pos, 4)) {
                        if (is_connected_port(pos, port_dest) || city.ruleset === 'micropolis') {
                            n_ports++;
                            city.tile_sub[pos] = 1;
                        }
                    }
                    break;
                case M_GOODS_ST | F_CENTER:
                    city.tile_sub[pos] = 0;
                    if (city.tile_power[pos] === 2 && is_traffic_connected(tile_i_zone, null, pos, 4)) {
                        let k = tile_s_zone[pos];
                        if (k > 0 && k < 255 && stn_group[k].outer) {
                            n_ports++;
                            city.tile_sub[pos] = 1;
                        }
                    }
                    break;
                case M_AIRPORT | F_CENTER:
                    if (city.tile_power[pos] === 2 && is_traffic_connected(tile_c_zone, 'c_zone', pos, 6)) {
                        n_airports++;
                        city.tile_sub[pos] = 1;
                    } else {
                        city.tile_sub[pos] = 0;
                    }
                    break;
                }
            }
        }

        if (this.ship_route.length === 0 && ship_dest.length > 0 && port_dest.length > 0) {
            let dest;
            if (is_ship_approaching_port) {
                let p = choice_random(ship_dest);
                this.ship_last_pos = p[0];
                dest = choice_random(port_dest);
                ship_port_dir = dest[1];
            } else {
                dest = choice_random(ship_dest);
            }
            tile_tmp[dest[0]] = 252;
            spread_zone_effect(tile_tmp, [dest[0]]);
            if (trace_ship_route(this, this.ship_last_pos, is_ship_approaching_port)) {
                is_ship_approaching_port = !is_ship_approaching_port;
            }
        }

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                let dec;
                let is_hq = false;

                switch (city.tile_data[pos]) {
                case M_POLICE_HQ | F_CENTER:
                    is_hq = true;
                    // fallthrough
                case M_POLICE_D | F_CENTER:
                    dec = (city.tile_power[pos] === 2 ? 4 : 3);
                    diffusion_road_sub(city.tile_police_d, x, y, police_power * dec, is_hq ? 12 : 16);
                    city.tile_sub[pos] = population_at(x, y) >> 2;
                    break;
                case M_FIRE_HQ | F_CENTER:
                    is_hq = true;
                    // fallthrough
                case M_FIRE_D | F_CENTER:
                    dec = (city.tile_power[pos] === 2 ? 4 : 3);
                    diffusion_road_sub(city.tile_fire_d, x, y, fire_power * dec, is_hq ? 12 : 16);
                    city.tile_sub[pos] = population_at(x, y) >> 2;
                    break;
                case M_STADIUM1 | F_CENTER:
                case M_STADIUM2 | F_CENTER:
                    if (city.tile_sub[pos] > 0) {
                        let audiences = Math.floor(city.r_zone_pops / (n_stadiums + 1) / 100);
                        if (audiences < 1) {
                            audiences = 1;
                        } else if (audiences > 30) {
                            audiences = 30;
                        }
                        city.tile_sub[pos] = audiences;
                    }
                    break;
                case M_PORT | F_CENTER:
                case M_GOODS_ST | F_CENTER:
                    if (city.tile_sub[pos] > 0) {
                        let cargo = Math.floor(city.i_zone_pops / (n_ports + 1) / 100);
                        if (cargo < 1) {
                            cargo = 1;
                        } else if (cargo > 30) {
                            cargo = 30;
                        }
                        city.tile_sub[pos] = cargo;
                    }
                    break;
                case M_AIRPORT | F_CENTER:
                    if (city.tile_sub[pos] > 0) {
                        let passengers = Math.floor(city.c_zone_pops / (n_airports + 1) / 100);
                        if (passengers < 1) {
                            passengers = 1;
                        } else if (passengers > 30) {
                            passengers = 30;
                        }
                        city.tile_sub[pos] = passengers;
                    }
                    break;
                }
            }
        }
    };
    this.crime = function() {
        city.tile_crime.fill(0);
        tile_tmp.fill(0);
        crime_total = 0;

        let size = map_size2 * map_size2;
        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                if (city.tile_data[x + y * map_size2] === (M_CASINO | F_CENTER)) {
                    diffusion_sub(tile_tmp, x >> 1, y >> 1, 72, 3);
                }
            }
        }
        for (let i = 0; i < size; i++) {
            if ((tile_land_v[i] & V_BUILD) !== 0) {
                let c = city.tile_population[i] - city.tile_police_d[i] + tile_tmp[i];
                if (city.tile_land_value[i] > 48) {
                    c -= city.tile_land_value[i] - 48;
                }
                if (c < 0) c = 0;
                city.tile_crime[i] = c;
                crime_total += c;
            }
        }
    };
    this.land_value = function() {
        let size = map_size2 * map_size2;
        let value_area = 0;
        let value_total = 0;

        city.tile_land_value.fill(0);
        for (let y = 0; y < map_size_edge; y++) {
            for (let x = 0; x < map_size_edge; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;

                switch (city.tile_data[pos]) {
                case M_YR_HOUSE | F_CENTER:
                case M_AMUSEMENT | F_CENTER:
                case M_CASINO | F_CENTER:
                case M_M_STATUE | F_CENTER:
                case M_ZOO | F_CENTER:
                    if (city.tile_power[pos] === 2) {
                        diffusion_sub(city.tile_land_value, x, y, 80, 4);
                    }
                    break;
                case M_TERM_STN | F_CENTER:
                case M_BANK | F_CENTER:
                case M_LIBRARY | F_CENTER:
                    if (city.tile_power[pos] === 2) {
                        diffusion_sub(city.tile_land_value, x, y, 64, 3);
                    }
                    break;
                }
            }
        }

        for (let y = 0; y < map_size2; y++) {
            let pos = 1 + (y << 2) * map_size_edge;
            for (let x = 0; x < map_size2; x++) {
                let i = x + y * map_size2;
                let v = tile_land_v[i];
                if ((v & V_BUILD) !== 0) {
                    let c = v & 31;
                    if ((v & V_WATER) !== 0) {
                        c += 5;
                    }
                    c *= 8;
                    switch (city.tile_data[pos + (x << 1)]) {
                    case M_R_ZONE:
                    case M_R_ZONE | F_CENTER:
                        c -= city.tile_pollution[i] >> 1;
                        break;
                    default:
                        c -= city.tile_pollution[i] >> 2;
                        break;
                    }
                    if (city.tile_crime[i] >= 32) {
                        c -= city.tile_crime[i] - 32;
                    }

                    let d = Math.floor(64 * ((map_size2 >> 1) - Math.abs(x - this.barycenter_x) - Math.abs(y - this.barycenter_y)) / map_size2);
                    if (d < 0) {
                        d = 0;
                    }
                    c += d;
                    c += city.tile_land_value[i];
                    if (c > 255) {
                        c = 255;
                    } else if (c < 1) {
                        c = 1;
                    }
                    city.tile_land_value[i] = c;
                    value_total += c;
                    value_area++;
                } else {
                    city.tile_land_value[i] = 0;
                }
            }
        }
        value_average = Math.floor(value_total / value_area);
    };

    this.update_land_v = function() {
        tile_land_v.fill(0);
        let mask = (city.ruleset === 'tinycity' ? M_ROAD_WT : (M_ROAD_WT | M_RAIL_WT));

        for (let y = 0; y < map_size2; y++) {
            for (let x = 0; x < map_size2; x++) {
                let p = x + y * map_size2;
                for (let yy = y * 2; yy < y * 2 + 2; yy++) {
                    for (let xx = x * 2; xx < x * 2 + 2; xx++) {
                        let t = city.tile_data[xx + 1 + (yy + 1) * map_size_edge];
                        if ((t & mask) !== 0) {
                            tile_land_v[p] |= V_ROAD | V_BUILD;
                        } else if ((t & 0x3FF0) !== 0) {
                            tile_land_v[p] |= V_BUILD;
                        }
                    }
                }
                let x1 = (x > 3 ? (x - 3) * 2 : 0);
                let y1 = (y > 3 ? (y - 3) * 2 : 0);
                let x2 = (x < map_size2 - 3 ? (x + 3) * 2 : map_size2 * 2);
                let y2 = (y < map_size2 - 3 ? (y + 3) * 2 : map_size2 * 2);
                let tree = 0;
                for (let yy = y1; yy < y2; yy++) {
                    let pos = 1 + (yy + 1) * map_size_edge;
                    for (let xx = x1; xx < x2; xx++) {
                        let t = city.tile_data[pos + xx];
                        if (t === M_TREE) {
                            tree++;
                        } else if ((t & M_LAND) === 0) {
                            tile_land_v[p] |= V_WATER;
                        }
                    }
                }
                if (tree > 6) {
                    tile_land_v[p] |= 6;
                } else {
                    tile_land_v[p] |= tree;
                }
            }
        }
    };
    this.update_month_budget = function() {
        let n_traffic = 0;
        let n_police = 0;
        let n_fire = 0;
        let n_tax = 0;
        let special_income = 0;

        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                switch (city.tile_data[pos]) {
                case M_ROAD:
                case M_ROADWIRE:
                    n_traffic += 0.75;
                    break;
                case M_ROADRAIL:
                    n_traffic += 2;
                    break;
                case M_ROAD_WT:
                case M_ROAD_WT | F_CENTER:
                    n_traffic += 1.5;
                    break;
                case M_RAIL:
                    n_traffic += 1.25;
                    break;
                case M_RAIL_WT:
                case M_RAIL_WT | F_CENTER:
                    n_traffic += 2.5;
                    break;
                case M_POLICE_D | F_CENTER:
                case M_POLICE_HQ | F_CENTER:
                    n_police++;
                    break;
                case M_FIRE_D | F_CENTER:
                case M_FIRE_HQ | F_CENTER:
                    n_fire++;
                    break;
                case M_R_ZONE | F_CENTER:
                case M_C_ZONE | F_CENTER:
                case M_I_ZONE | F_CENTER:
                    {
                        let pos2 = (x >> 1) + (y >> 1) * map_size2;
                        n_tax += city.tile_sub[pos] * city.tile_land_value[pos2];
                    }
                    break;
                case M_TERM_STN | F_CENTER:
                    special_income += 300;
                    break;
                case M_CASINO | F_CENTER:
                    special_income += 400;
                    break;
                case M_ZOO | F_CENTER:
                    special_income += 200;
                    break;
                }
            }
        }
        city.tax_collected += Math.round(n_tax * city.tax_rate / 512);

        if (city.difficulty === 'expert' || city.difficulty === 'master') {
            n_traffic *= 1.5;
            if (city.ruleset === 'tinycity') {
                n_police *= 1.5;
                n_fire *= 1.5;
            }
        }
        if (city.ruleset === 'tinycity') {
            city.traffic_cost += Math.round(n_traffic * city.traffic_funds_term / 1200);
            city.police_cost += Math.round(n_police * city.police_funds_term / 10);
            city.fire_cost += Math.round(n_fire * city.fire_funds_term / 10);

            city.traffic_funds_term = city.traffic_funds;
            city.police_funds_term  = city.police_funds;
            city.fire_funds_term    = city.fire_funds;
        } else {
            city.traffic_cost = Math.round(n_traffic);
            city.police_cost = Math.round(n_police * 100);
            city.fire_cost = Math.round(n_fire * 100);
        }
        city.special_income = special_income;
    };
    this.reset_budget = function() {
        city.tax_collected = 0;
        city.special_income = 0;
        city.traffic_cost = 0;
        city.police_cost = 0;
        city.fire_cost = 0;
    };
    this.update_demand = function() {
        let r = city.hist_r[city.hist_r.length - 4];
        let c = city.hist_c[city.hist_c.length - 4];
        let i = city.hist_i[city.hist_i.length - 4];
        let all = r + c + i + 10;
        let tax_offset = (10 - city.tax_rate) / 20;

        let r_demand = c + i;
        let c_demand = Math.min(r - i, r >> 1);
        let i_demand = r >> 1;
        let r_capacity = 60 + 70 * n_stadiums;
        let c_capacity = 80 + 100 * n_airports;
        let i_capacity = 70 + 80 * n_ports;

        city.r_demand_capacity = r_capacity - r_demand;
        city.c_demand_capacity = c_capacity - c_demand;
        city.i_demand_capacity = i_capacity - i_demand;
        if (r_demand > r_capacity) {
            r_demand = r_capacity;
        }
        if (c_demand > c_capacity) {
            c_demand = c_capacity;
        }
        if (i_demand > i_capacity) {
            i_demand = i_capacity;
        }

        city.r_demand = 2 * (r_demand - r) / all + tax_offset;
        city.c_demand = 2 * (c_demand - c) / all + tax_offset;
        city.i_demand = 2 * (i_demand - i) / all + tax_offset;

        if (city.r_demand < -1) {
            city.r_demand = -1;
        } else if (city.r_demand > 1) {
            city.r_demand = 1;
        }
        if (city.c_demand < -1) {
            city.c_demand = -1;
        } else if (city.c_demand > 1) {
            city.c_demand = 1;
        }
        if (city.i_demand < -1) {
            city.i_demand = -1;
        } else if (city.i_demand > 1) {
            city.i_demand = 1;
        }
    };
    this.update_month_graph = function() {
        const GRAPH_LAST = 12 * GRAPH_YEARS - 1;
        city.hist_r.copyWithin(0, 1);
        city.hist_c.copyWithin(0, 1);
        city.hist_i.copyWithin(0, 1);
        city.hist_crime.copyWithin(0, 1);
        city.hist_pollution.copyWithin(0, 1);
        city.hist_value.copyWithin(0, 1);

        let rci = Math.sqrt(city.r_zone_pops + city.c_zone_pops + city.i_zone_pops);
        if (rci > 0) {
            city.hist_r[GRAPH_LAST] = Math.round(city.r_zone_pops / rci);
            city.hist_c[GRAPH_LAST] = Math.round(city.c_zone_pops / rci);
            city.hist_i[GRAPH_LAST] = Math.round(city.i_zone_pops / rci);
        } else {
            city.hist_r[GRAPH_LAST] = 0;
            city.hist_c[GRAPH_LAST] = 0;
            city.hist_i[GRAPH_LAST] = 0;
        }
        city.hist_crime[GRAPH_LAST] = Math.round(Math.sqrt(crime_total));
        city.hist_pollution[GRAPH_LAST] = Math.round(Math.sqrt(pollution_total));
        city.hist_value[GRAPH_LAST] = value_average;
    };
    this.is_disaster_occur = function() {
        switch (city.difficulty) {
        case 'novice':
        case 'expert':
            break;
        case 'master':
            break;
        default:
            break;
        }
        return null;
    };
    function put_fire(p, size, flag) {
        switch (size) {
        case 3:
            p -= map_size_edge + 1;
            break;
        case 4:
            p -= map_size_edge + 1;
            break;
        case 6:
            p -= map_size_edge * 2 + 2;
            break;
        }
        for (let yy = 0; yy < size; yy++) {
            for (let xx = 0; xx < size; xx++) {
                city.tile_data[p + xx] = M_RUBBLE;
                city.tile_sub[p + xx] = 0;
                city.tile_fire[p + xx] |= flag;
                city.tile_power[p + xx] = 0;
            }
            p += map_size_edge;
        }
    }
    this.disaster_fire = function() {
        let buildings = [];
        for (let pos = map_size_edge; pos < map_size_edge * map_size; pos++) {
            let t = city.tile_data[pos];
            if ((t & F_CENTER) !== 0 && (t & 0x3F00) !== 0) {
                switch (t) {
                case M_GOODS_ST | F_CENTER:
                case M_STADIUM1 | F_CENTER:
                case M_STADIUM2 | F_CENTER:
                case M_PORT | F_CENTER:
                case M_COAL_PWR | F_CENTER:
                case M_GAS_PWR | F_CENTER:
                case M_NUKE_PWR | F_CENTER:
                case M_AIRPORT | F_CENTER:
                    break;
                default:
                    buildings.push(pos);
                    break;
                }
            }
        }
        if (buildings.length === 0) {
            return null;
        }
        let p = choice_random(buildings);
        let x = (p % map_size_edge) - 1;
        let y = Math.floor(p / map_size_edge) - 1;
        put_fire(p, 3, MF_FIRE);
        city.disaster_occurs = true;
        city.disaster_ticks = 0;
        return {x:x, y:y};
    };
    this.disaster_quake = function() {
        let p = city.get_center(Math.floor(Math.random() * map_size), Math.floor(Math.random() * map_size));
        let pos = p.x + 1 + (p.y + 1) * map_size_edge;
        let t = city.tile_data[pos];

        switch (city.get_building_size(t)) {
        case 1:
            switch (t) {
            case M_ROAD:
            case M_RAIL:
            case M_WIRE:
            case M_ROADRAIL:
            case M_ROADWIRE:
            case M_RAILWIRE:
                city.tile_data[pos] = M_RUBBLE;
                city.tile_power[pos] = M_RUBBLE;
                break;
            }
            break;
        case 3:
            {
                let fd = city.tile_fire_d[(p.x >> 1) | (p.y >> 1) * map_size2];
                if (Math.random() * 64 >= fd) {
                    put_fire(pos, 3, MF_FIRE);
                    city.disaster_occurs = true;
                } else {
                    put_fire(pos, 3, 0);
                }
            }
            break;
        case 4:
        case 6:
            return;
        }
        city.calculate_power_grid_required = true;
        city.update_power_grid_required = true;
    };
    this.disaster_meltdown = function() {
        let nuke_power = [];
        for (let pos = map_size_edge; pos < map_size_edge * map_size; pos++) {
            let t = city.tile_data[pos];
            if (t === (M_NUKE_PWR | F_CENTER)) {
                nuke_power.push(pos);
            }
        }
        if (nuke_power.length === 0) {
            return null;
        }
        let p = choice_random(nuke_power);
        let x = (p % map_size_edge) - 1;
        let y = Math.floor(p / map_size_edge) - 1;

        put_fire(p, 4, MF_FIRE|MF_RADIO);
        for (let i = 0; i < 200; i++) {
            let th = Math.random() * Math.PI * 2;
            let r = Math.random() * 20;
            let xx = Math.floor(x + Math.sin(th) * r);
            let yy = Math.floor(y + Math.cos(th) * r);
            if (xx >= 1 && xx < map_size_edge - 1 && yy >= 1 && yy < map_size_edge - 1) {
                let pos2 = 1 + xx + (1 + yy) * map_size_edge;
                if ((city.tile_data[pos2] & M_LAND) !== 0) {
                    let p = city.get_center(xx, yy);
                    pos2 = 1 + p.x + (1 + p.y) * map_size_edge;
                    city.tile_fire[pos2] = MF_RADIO;
                }
            }
        }

        city.disaster_occurs = true;
        city.disaster_ticks = 0;
        city.calculate_power_grid_required = true;
        city.update_power_grid_required = true;

        return {x:x, y:y};
    };
    this.disaster_destroy = function(x, y) {
        let pos = 1 + x + (1 + y) * map_size_edge;
        let t = city.tile_data[pos];
        if ((t & M_LAND) !== 0) {
            if ((t & 0x3F00) !== 0) {
                let p = city.get_center(x, y);
                let size = city.get_building_size(t);
                put_fire(p.x + 1 + (p.y + 1) * map_size_edge, size, 0);
                city.calculate_power_grid_required = true;
                city.update_power_grid_required = true;
            } else {
                if (t !== M_LAND && t !== M_RUBBLE) {
                    city.tile_data[pos] = M_RUBBLE;
                    city.calculate_power_grid_required = true;
                    city.update_power_grid_required = true;
                }
            }
            return true;
        } else {
            return false;
        }
    };
    this.disaster_ufo = function() {
        this.ufo_route = [];

        let x = Math.floor((Math.random() * 0.75 + 0.125) * map_size);
        let y = Math.floor((Math.random() * 0.75 + 0.125) * map_size);

        if ((city.tile_data[1 + x + (1 + y) * map_size_edge] & M_LAND) === 0 && Math.random() < 0.5) {
            this.ufo_route.push({type: 'none', x:x, y:y});
            for (let i = 0; i < 6 && this.ufo_route.length < 4; i++) {
                x = Math.floor((Math.random() * 0.75 + 0.125) * map_size);
                y = Math.floor((Math.random() * 0.75 + 0.125) * map_size);
                if ((city.tile_data[1 + x + (1 + y) * map_size_edge] & M_LAND) !== 0) {
                    this.ufo_route.push({type: 'flood', x:x, y:y});
                }
            }
            return true;
        }
        let presents = [];
        for (let i = map_size_edge; i < map_size_edge * map_size; i++) {
            let t = city.tile_data[i];
            if (t >= (M_GIFT_WT | F_CENTER)) {
                presents.push(i);
            }
        }
        if (presents.length > 4 && Math.random() < 0.5) {
            for (let i = 0; i < 3; i++) {
                let n = Math.floor(Math.random() * presents.length);
                let pos = presents[n];
                this.ufo_route.push({type: 'fire', x:(pos % map_size_edge - 1), y:Math.floor(pos / map_size_edge) - 1});
                presents.splice(n, 1);
            }
            return true;
        }

        let rnd = Math.random();
        let type;
        if (rnd < 0.25) {
            type = 'fire';
        } else if (rnd < 0.5) {
            type = 'tree';
        } else if (rnd < 0.75) {
            type = 'radio';
        } else {
            type = 'stadium';
        }
        for (let i = 0; i < 4; i++) {
            x = Math.floor((Math.random() * 0.75 + 0.125) * map_size);
            y = Math.floor((Math.random() * 0.75 + 0.125) * map_size);
            this.ufo_route.push({type:type, x:x, y:y});
        }
        return true;
    };
    this.disaster_ufo_attack = function(x, y, type) {
        let pos = 1 + x + (1 + y) * map_size_edge;
        switch (type) {
        case 'fire':
            for (let yy = -1; yy < 2; yy++) {
                for (let xx = -1; xx < 2; xx++) {
                    put_fire_1(x + xx, y + yy, pos + xx + yy * map_size_edge, MF_FIRE);
                }
            }
            city.disaster_occurs = true;
            city.disaster_ticks = 0;
            break;
        case 'tree':
            for (let yy = -1; yy < 2; yy++) {
                for (let xx = -1; xx < 2; xx++) {
                    let p = pos + xx + yy * map_size_edge;
                    put_fire_1(x + xx, y + yy, p, 0);
                    if ((city.tile_data[p] & M_LAND) !== 0) {
                        city.tile_data[p] = M_TREE;
                    }
                }
            }
            break;
        case 'flood':
            city.tile_fire[pos] = MF_FLOOD;
            if (this.flood_time_left === 0) {
                this.flood_time_left = Math.floor(Math.random() * 16) + 8;
            }
            city.disaster_occurs = true;
            city.disaster_ticks = 0;
            break;
        case 'radio':
            break;
        case 'stadium':
            {
                let space = true;
                for (let yy = -1; yy < 3; yy++) {
                    for (let xx = -1; xx < 3; xx++) {
                        let p = pos + xx + yy * map_size_edge;
                        put_fire_1(x + xx, y + yy, p, 0);
                        if ((city.tile_data[p] & M_LAND) === 0) {
                            space = false;
                        }
                    }
                }
                if (space) {
                    for (let yy = -1; yy < 3; yy++) {
                        for (let xx = -1; xx < 3; xx++) {
                            city.tile_data[pos + xx + yy * map_size_edge] = (xx === 0 && yy === 0) ? (M_STADIUM2 | F_CENTER) : M_STADIUM2;
                        }
                    }
                }
            }
            break;
        }
    };
    function put_fire_1(x, y, pos, flag) {
        let t = city.tile_data[pos];
        if ((t & M_LAND) !== 0) {
            if ((t & 0x3F00) !== 0) {
                let p = city.get_center(x, y);
                let size = city.get_building_size(t);
                put_fire(p.x + 1 + (p.y + 1) * map_size_edge, size, flag);
            } else {
                if (t !== M_LAND && t !== M_RUBBLE) {
                    city.tile_data[pos] = M_RUBBLE;
                }
                city.tile_fire[pos] |= flag;
            }
        }
    }
    this.disaster_monster_fire = function(cx, cy, d) {
        let dx = (d === 1 ? -1 : d === 3 ? 1 : 0);
        let dy = (d === 0 ? 1 : d === 2 ? -1 : 0);

        for (let i = 1; i < 5; i++) {
            for (let j = -i + 1; j < i; j++) {
                let x = cx + dx * (i + 1) + dy * j;
                let y = cy + dy * (i + 1) - dx * j;
                if (x >= 1 && x < map_size_edge - 1 && y >= 1 && y < map_size_edge - 1) {
                    let pos = 1 + x + (1 + y) * map_size_edge;
                    put_fire_1(x, y, pos, MF_FIRE);
                }
            }
        }

        city.calculate_power_grid_required = true;
        city.update_power_grid_required = true;
    };
    this.disaster_vehicle_crash = function(x, y, is_ship) {
        let pos = 1 + x + (1 + y) * map_size_edge;
        put_fire_1(x, y, pos, MF_FIRE);
        if (x > 0 && y > 0)
            put_fire_1(x - 1, y - 1, pos - map_size_edge - 1, MF_FIRE);
        if (x < city.map_size - 1 && y > 0)
            put_fire_1(x + 1, y - 1, pos - map_size_edge + 1, MF_FIRE);
        if (x > 0 && y < city.map_size - 1)
            put_fire_1(x - 1, y + 1, pos + map_size_edge - 1, MF_FIRE);
        if (x < city.map_size - 1 && y < city.map_size - 1)
            put_fire_1(x + 1, y + 1, pos + map_size_edge + 1, MF_FIRE);

        if (is_ship) {
            is_ship_approaching_port = true;
        }
        city.disaster_occurs = true;
        city.disaster_ticks = 0;
        city.calculate_power_grid_required = true;
        city.update_power_grid_required = true;
    };
    this.disaster_flood = function() {
        let map_size_1 = map_size - 1;
        let coast = [];

        for (let y = 1; y < map_size_1; y++) {
            for (let x = 1; x < map_size_1; x++) {
                let pos = 1 + x + (1 + y) * map_size_edge;
                if ((city.tile_data[pos] & M_LAND) !== 0) {
                    for (let i = 0; i < 4; i++) {
                        if ((city.tile_data[pos + pos_dir[i]] & M_LAND) === 0) {
                            coast.push(pos);
                            break;
                        }
                    }
                }
            }
        }
        if (coast.length === 0) {
            return null;
        }
        let pos = choice_random(coast);
        city.tile_fire[pos] = MF_FLOOD;
        let x = (pos % map_size_edge) - 1;
        let y = Math.floor(pos / map_size_edge) - 1;
        city.disaster_occurs = true;
        city.disaster_ticks = 0;
        if (this.flood_time_left === 0) {
            this.flood_time_left = Math.floor(Math.random() * 16) + 8;
        }
        return {x:x, y:y};
    };
    function is_spread_fire(pos, size, fd) {
        if ((city.tile_fire[pos] & MF_FLOOD) !== 0) {
            return false;
        }

        let count = 0;
        let b1, b2, d;
        let r = Math.random() * (fd + 2.5);

        switch (size) {
        case 1:
            for (let i = 0; i < 4; i++) {
                if ((city.tile_fire[pos + pos_dir[i]] & MF_FIRE) !== 0) {
                    count++;
                }
            }
            return r < count;
        case 3:
            b1 = -2;
            b2 = 2;
            d = -1;
            break;
        case 4:
            b1 = -2;
            b2 = 3;
            d = -1;
            break;
        case 6:
            b1 = -3;
            b2 = 4;
            d = -2;
            break;
        }
        for (let i = 0; i < size; i++) {
            if ((city.tile_fire[pos + map_size_edge * b1 + i + d] & MF_FIRE) !== 0) {
                count++;
            }
            if ((city.tile_fire[pos + map_size_edge * b2 + i + d] & MF_FIRE) !== 0) {
                count++;
            }
            if ((city.tile_fire[pos + b1 + (i + d) * map_size_edge] & MF_FIRE) !== 0) {
                count++;
            }
            if ((city.tile_fire[pos + b2 + (i + d) * map_size_edge] & MF_FIRE) !== 0) {
                count++;
            }
        }
        return r < count;
    }
    this.update_disaster = function(exist_mob) {
        // spreading fire and flood
        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                let t = city.tile_data[pos];
                let fd = city.tile_fire_d[(x >> 1) + (y >> 1) * map_size2] >> 3;

                switch (t) {
                case M_ROAD:
                case M_RAIL:
                case M_WIRE:
                case M_ROADRAIL:
                case M_ROADWIRE:
                case M_RAILWIRE:
                    if (city.ruleset === 'micropolis') {
                        if (is_spread_fire(pos, 1, fd)) {
                            put_fire(pos, 1, MF_FIRE_TMP);
                        }
                    }
                    break;
                case M_TREE:
                    if (is_spread_fire(pos, 1, fd)) {
                        put_fire(pos, 1, MF_FIRE_TMP);
                    }
                    break;
                case M_GOODS_ST | F_CENTER:
                case M_STADIUM1 | F_CENTER:
                case M_STADIUM2 | F_CENTER:
                case M_PORT | F_CENTER:
                case M_COAL_PWR | F_CENTER:
                case M_GAS_PWR | F_CENTER:
                case M_NUKE_PWR | F_CENTER:
                    if (is_spread_fire(pos, 4, fd)) {
                        put_fire(pos, 4, MF_FIRE_TMP);
                    }
                    break;
                case M_AIRPORT | F_CENTER:
                    if (is_spread_fire(pos, 6, fd)) {
                        put_fire(pos, 6, MF_FIRE_TMP);
                    }
                    break;
                default:
                    if ((t & F_CENTER) !== 0 && (t & 0x3F00) !== 0 && (t & F_BLDGS) !== 0) {
                        if (is_spread_fire(pos, 3, fd)) {
                            put_fire(pos, 3, MF_FIRE_TMP);
                        }
                    }
                    break;
                }
                if ((city.tile_fire[pos] & MF_FLOOD) !== 0 && this.flood_time_left > 0) {
                    for (let i = 0; i < 4; i++) {
                        if (Math.random() < 0.5 && (city.tile_data[pos + pos_dir[i]] & M_LAND) !== 0) {
                            let p_dir = pos + pos_dir[i];
                            if ((city.tile_fire[p_dir] & (MF_FLOOD | MF_FLOOD_TMP)) === 0) {
                                city.tile_fire[p_dir] = MF_FLOOD_TMP;
                                if (Math.random() < 0.25 && (city.tile_data[p_dir] & 0x3F00) === 0) {
                                    if (t === M_WIRE) {
                                        city.calculate_power_grid_required = true;
                                        city.update_power_grid_required = true;
                                    }
                                    if (t !== M_LAND) {
                                        city.tile_data[p_dir] = M_RUBBLE;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        let exist = 0;
        for (let y = 0; y < map_size; y++) {
            for (let x = 0; x < map_size; x++) {
                let pos = x + 1 + (y + 1) * map_size_edge;
                let f = city.tile_fire[pos];
                if ((f & MF_FIRE) !== 0) {
                    if (Math.random() < 0.75) {
                        city.tile_fire[pos] = f & ~MF_FIRE;
                    } else {
                        exist = true;
                    }
                } else if ((f & MF_FIRE_TMP) !== 0) {
                    city.tile_fire[pos] = (city.tile_fire[pos] & ~MF_FIRE_TMP) | MF_FIRE;
                    exist = true;
                } else if ((f & MF_FLOOD) !== 0) {
                    if (this.flood_time_left === 0 && Math.random() < 0.75) {
                        city.tile_fire[pos] = 0;
                        let t = city.tile_data[pos];
                        if (Math.random() < 0.0625 && (t & 0x3F00) !== 0) {
                            let p = city.get_center(x, y);
                            put_fire(p.x + 1 + (p.y + 1) * map_size_edge, city.get_building_size(t), 0);
                        }
                    } else {
                        exist = true;
                    }
                } else if ((f & MF_FLOOD_TMP) !== 0) {
                    city.tile_fire[pos] = MF_FLOOD;
                    exist = true;
                }
            }
        }
        if (exist || exist_mob) {
            if (this.flood_time_left > 0) {
                this.flood_time_left--;
            }
        } else {
            city.disaster_occurs = false;
            this.flood_time_left = 0;
        }
        city.calculate_power_grid_required = true;
        city.update_power_grid_required = true;
    };
    this.update_radioisotope_decay = function() {
        let decay = false;
        for (let i = map_size_edge; i < map_size_edge * map_size; i++) {
            if ((city.tile_fire[i] & MF_RADIO) !== 0) {
                if (Math.random() < 0.0625) {
                    city.tile_fire[i] &= ~MF_RADIO;
                    decay = true;
                }
            }
        }
        return decay;
    };

    this.rotate_cw = function() {
        array_rotate_cw(tile_r_zone, map_size_edge);
        array_rotate_cw(tile_c_zone, map_size_edge);
        array_rotate_cw(tile_i_zone, map_size_edge);
        array_rotate_cw(tile_s_zone, map_size_edge);
        array_rotate_cw(tile_land_v, map_size2);
        if (this.airport_active_x >= 0) {
            let x = this.airport_active_x;
            this.airport_active_x = map_size - this.airport_active_y - 1;
            this.airport_active_y = x;
        }
        for (let i = 0; i < this.ship_route.length; i++) {
            let r = this.ship_route[i];
            if (r != null) {
                this.ship_route[i] = (r + 2) & 0x17;
            }
        }
        ship_port_dir = (ship_port_dir + 2) & 7;
        {
            let x = this.ship_last_pos % map_size_edge;
            let y = Math.floor(this.ship_last_pos / map_size_edge);
            this.ship_last_pos = (map_size_edge - y - 1) + x * map_size_edge;
        }
    };
    this.rotate_ccw = function() {
        array_rotate_ccw(tile_r_zone, map_size_edge);
        array_rotate_ccw(tile_c_zone, map_size_edge);
        array_rotate_ccw(tile_i_zone, map_size_edge);
        array_rotate_ccw(tile_s_zone, map_size_edge);
        array_rotate_ccw(tile_land_v, map_size2);
        if (this.airport_active_x >= 0) {
            let x = this.airport_active_x;
            this.airport_active_x = this.airport_active_y;
            this.airport_active_y = map_size - x - 1;
        }
        for (let i = 0; i < this.ship_route.length; i++) {
            let r = this.ship_route[i];
            if (r != null) {
                this.ship_route[i] = (r + 6) & 0x17;
            }
        }
        ship_port_dir = (ship_port_dir + 2) & 7;
        {
            let x = this.ship_last_pos % map_size_edge;
            let y = Math.floor(this.ship_last_pos / map_size_edge);
            this.ship_last_pos = y + (map_size_edge - x - 1) * map_size_edge;
        }
    };
    this.update_ticks = function() {
        ticks3++;
        if (ticks3 >= 3) {
            ticks3 = 0;
        }
        ticks4++;
        if (ticks4 >= 4) {
            ticks4 = 0;
        }
    };

/*
    function heatmap(lv) {
        if (lv < 64) {
            // #008000 -> #00ff00
            return 0x008000 | (lv << 9);
        } else if (lv < 128) {
            // #00ff00 -> #ffff00
            return 0x00ff00 | ((lv - 64) << 18);
        } else if (lv < 192) {
            // #ffff00 -> #ff0000
            return 0xff0000 | ((191 - lv) << 10);
        } else if (lv < 256) {
            // #ff0000 -> #ffffff
            return 0xff0000 | ((lv - 192) << 10) | ((lv - 192) << 2);
        } else {
            return 0xffffff;
        }
    }
    function put_pixel(data, x, y, w, lv) {
        let x1 = (x - y) + w / 2;
        let y1 = (x + y);
        let pos = (x1 + y1 * w) * 4;

        let color = heatmap(lv);
        let r = color >> 16;
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;
        data[pos + 0] = r;
        data[pos + 1] = g;
        data[pos + 2] = b;
        data[pos + 3] = 255;
        data[pos + 4] = r;
        data[pos + 5] = g;
        data[pos + 6] = b;
        data[pos + 7] = 255;
    }
    this.debug = function(canvas) {
        const w = canvas.width;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        set_sea_area();

        for (let y = 0; y < map_size; y++) {
            let line = 1 + (y + 1) * map_size_edge;

            for (let x = 0; x < map_size; x++) {
                let color = 0;
                let t = tile_tmp[line + x];
                if (t > 0) {
                    put_pixel(imData.data, x, y, w, heatmap(t));
                }
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
*/
}
