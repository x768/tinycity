'use strict';

(fn => {
    if (document.readyState !== 'loading'){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
})(() => {
    const ICON_W = 64;
    const ICON_H = 48;

    const BUILD_TYPE_PEN1 = 0;
    const BUILD_TYPE_PEN3 = 1;
    const BUILD_TYPE_LINE = 2;
    const BUILD_TYPE_RECT = 3;

    const BUILD_ICON_INFO_TERRAIN1 = [
        { size: 1, cost: 0, name: 'water_area' },
        { size: 1, cost: 0, name: 'land_clear' },
        { size: 1, cost: 0, name: 'tree' },
        { size: 1, cost: 0, name: 'rubble' },
        { size: 1, cost: 0, name: 'fire' },
        { size: 1, cost: 0, name: 'road' },
        { size: 1, cost: 0, name: 'railroad' },
        { size: 1, cost: 0, name: 'wire' },
    ];
    const BUILD_ICON_INFO_TERRAIN2 = [
        { size: 3, cost: 0, name: 'r_zone', tile:M_R_ZONE },
        { size: 3, cost: 0, name: 'c_zone', tile:M_C_ZONE },
        { size: 3, cost: 0, name: 'i_zone', tile:M_I_ZONE },
        { size: 3, cost: 0, name: 'hospital', tile:M_HOSPITAL },
        { size: 3, cost: 0, name: 'school', tile:M_SCHOOL },
        { size: 3, cost: 0, name: 'station', tile:M_STATION },
        { size: 3, cost: 0, name: 'police_dept', tile:M_POLICE_D },
        { size: 3, cost: 0, name: 'fire_dept', tile:M_FIRE_D },
        { size: 4, cost: 0, name: 'stadium1' },
        { size: 4, cost: 0, name: 'stadium2' },
        { size: 4, cost: 0, name: 'goods_st' },
        { size: 4, cost: 0, name: 'sea_port' },
        { size: 6, cost: 0, name: 'airport' },
        { size: 4, cost: 0, name: 'coal_power_plant' },
        { size: 4, cost: 0, name: 'gas_power_plant' },
        { size: 4, cost: 0, name: 'nuke_power_plant' },
    ];
    const BUILD_ICON_INFO_TERRAIN3 = [];
    for (let k in BUILD_ICON_INFO_GIFT) {
        if (k !== 'land_fill') {
            BUILD_ICON_INFO_TERRAIN3.push(BUILD_ICON_INFO_GIFT[k]);
        }
    }
    const DISASTERS = {
        fire: true,
        flood: true,
        airplane_crash: true,
        shipwreck: true,
        tornado: true,
        earthquake: true,
        monster: true,
        ufo: true,
        meltdown: true,
    };
    const EVENT_COND_SYMBOLS = {
        population: true,
        base_score: true,
        year_month: true,
        afforestion: true,
        road: true,
        rail: true,
        police_dept: true,
        fire_dept: true,
        developed: true,
        hospitals: true,
        schools: true,
        funds_ge: true,
        funds_lt: true,
        stadium1: true,
        stadium2: true,
        land_clear: true,
        traffic_jam: true,
        crime: true,
        pollution: true,
        random: true,
    };

    const view = new View(window.devicePixelRatio);
    const popup = new Popup(view);
    let city = new City(MAP_SIZE_DEFAULT);
    let city_tmp = null;

    const main_view = document.getElementById('main-view');
    const build_icon_hilight1 = document.getElementById('build-icon-hilight');
    const build_icon_hilight2 = document.getElementById('build-icon-hilight2');

    let import_from = null;

    let current_build_index = 0;
    let current_build_type = BUILD_TYPE_PEN1;
    let build_icon_info = BUILD_ICON_INFO_TERRAIN1;
    let build_icon_page = 1;
    let current_build = build_icon_info[current_build_index];
    let lbuttondown = false;
    let rbuttondown = false;

    function set_select_elem(elem, keys, value) {
        let ch;
        while ((ch = elem.lastChild) != null) {
            elem.removeChild(ch);
        }
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let option = document.createElement('option');
            option.setAttribute('value', key);
            option.textContent = resource.gettext(key);
            elem.appendChild(option);
            if (key === value) {
                option.setAttribute('selected', true);
            }
        }
    }

    // call when switch language
    function update_menu_text() {
        function set_menu(id) {
            document.getElementById('menu-' + id).textContent = resource.gettext(id);
        }
        set_menu('file');
        set_menu('generate_terrain');
        set_menu('scenario');
        set_menu('election');

        set_select_elem(document.getElementById('indicator-ruleset'), ['micropolis', 'tinycity'], city.ruleset);
        set_select_elem(document.getElementById('indicator-difficulty'), ['creative', 'peaceful', 'novice', 'expert', 'master'], city.difficulty);
    }
    // visible location and compass
    function update_minimap() {
        document.getElementById('minimap-compass').setAttribute('transform', 'rotate(' + (city.rotate * 90 + 45) + ')');
        view.update_minimap();
    }
    // call when switch language
    function update_build_icons() {
        if (build_icon_page === 1) {
            build_icon_hilight1.style.left = (current_build_index * ICON_W + 300) + 'px';
            build_icon_hilight1.style.top = '';
            build_icon_hilight2.style.display = '';
            build_icon_hilight2.style.left = (current_build_type * ICON_W + 300) + 'px';
            view.set_cursor_size(current_build_type === BUILD_TYPE_PEN3 ? 3 : 1);
        } else {
            build_icon_hilight1.style.left = ((current_build_index >> 1) * ICON_W + 300) + 'px';
            build_icon_hilight1.style.top  = ((current_build_index %  2) * ICON_H + 40) + 'px';
            build_icon_hilight2.style.display = 'none';
            view.set_cursor_size(current_build.size);
        }
    }

    function bulldoze_building(cx, cy) {
        let p = city.get_center(cx, cy);
        return city.build_tile_at(p.x, p.y, {name:'bulldoze', size:1});
    }
    function tiles_bulldozable(x1, x2, y1, y2) {
        if (x1 < 0 || y1 < 0 || x2 > city.map_size || y2 > city.map_size) {
            return false;
        }
        for (let y = y1; y < y2; y++) {
            let i = 1 + (y + 1) * city.map_size_edge;
            for (let x = x1; x < x2; x++) {
                let tile_at = city.tile_data[i + x];
                if (tile_at === M_RUBBLE || tile_at === M_TREE || tile_at === M_WIRE) {
                } else if (tile_at !== M_LAND) {
                    return false;
                }
            }
        }
        return true;
    }
    function build_tile_sub(x1, x2, y1, y2) {
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
        x2++; y2++;

        let left = x1;
        let right = x2;
        let top = y1;
        let bottom = y2;

        let tile_data = city.tile_data;
        let tile_fire = city.tile_fire;
        let map_size_edge = city.map_size_edge;
        for (let y = y1; y < y2; y++) {
            let pos = 1 + (y + 1) * map_size_edge;
            for (let x = x1; x < x2; x++) {
                let t = tile_data[pos + x];
                let p = null;
                let wire = false;
                switch (current_build.name) {
                case 'water_area':
                    if ((t & M_WIRE_WT) !== 0) {
                        wire = true;
                    }
                    if ((t & M_LAND) !== 0) {
                        if ((t & 0x3F00) !== 0) {
                            p = bulldoze_building(x, y);
                        }
                    } else if (t !== M_WATER) {
                        p = bulldoze_building(x, y);
                    }
                    tile_data[pos + x] = M_WATER;
                    tile_fire[pos + x] = 0;
                    break;
                case 'land_clear':
                    if ((t & M_WIRE_WT) !== 0) {
                        wire = true;
                    }
                    if ((t & M_LAND) !== 0) {
                        if ((t & 0x3F00) !== 0) {
                            p = bulldoze_building(x, y);
                        }
                    } else if (t !== M_WATER) {
                        p = bulldoze_building(x, y);
                    }
                    tile_data[pos + x] = M_LAND;
                    tile_fire[pos + x] = 0;
                    break;
                case 'rubble':
                    if ((t & M_WIRE_WT) !== 0) {
                        wire = true;
                    }
                    if ((t & M_LAND) !== 0 && (t & 0x3F00) === 0) {
                        tile_data[pos + x] = M_RUBBLE;
                        tile_fire[pos + x] = 0;
                    }
                    break;
                case 'tree':
                    if ((t & M_WIRE_WT) !== 0) {
                        wire = true;
                    }
                    if ((t & M_LAND) !== 0 && (t & 0x3F00) === 0) {
                        tile_data[pos + x] = M_TREE;
                        tile_fire[pos + x] = 0;
                    }
                    break;
                case 'road':
                    if ((t & M_LAND) !== 0 && (t & 0x3F00) === 0) {
                        switch (t) {
                        case M_RAIL:
                            tile_data[pos + x] = M_ROADRAIL;
                            break;
                        case M_WIRE:
                            tile_data[pos + x] = M_ROADWIRE;
                            break;
                        case M_ROADRAIL:
                        case M_ROADWIRE:
                            break;
                        default:
                            tile_data[pos + x] = M_ROAD;
                            break;
                        }
                        tile_fire[pos + x] = 0;
                    }
                    break;
                case 'railroad':
                    if ((t & M_LAND) !== 0 && (t & 0x3F00) === 0) {
                        switch (t) {
                        case M_ROAD:
                            tile_data[pos + x] = M_ROADRAIL;
                            break;
                        case M_WIRE:
                            tile_data[pos + x] = M_RAILWIRE;
                            break;
                        case M_ROADRAIL:
                        case M_RAILWIRE:
                            break;
                        default:
                            tile_data[pos + x] = M_RAIL;
                            break;
                        }
                        tile_fire[pos + x] = 0;
                    }
                    break;
                case 'wire':
                    if ((t & M_LAND) !== 0 && (t & 0x3F00) === 0) {
                        switch (t) {
                        case M_ROAD:
                            tile_data[pos + x] = M_ROADWIRE;
                            break;
                        case M_RAIL:
                            tile_data[pos + x] = M_RAILWIRE;
                            break;
                        case M_ROADWIRE:
                        case M_RAILWIRE:
                            break;
                        default:
                            tile_data[pos + x] = M_WIRE;
                            break;
                        }
                        tile_fire[pos + x] = 0;
                    }
                    break;
                case 'fire':
                    if ((t & M_LAND) !== 0) {
                        if ((t & M_WIRE_WT) !== 0) {
                            wire = true;
                        }
                        if ((t & 0x3F00) !== 0) {
                            p = bulldoze_building(x, y);
                        }
                        if (t !== M_LAND) {
                            tile_data[pos + x] = M_RUBBLE;
                        }
                        tile_fire[pos + x] = MF_FIRE;
                    }
                    break;
                default:
                    if (city.calc_build_cost_at(x, y, current_build) >= 0) {
                        p = city.build_tile_at(x, y, current_build);
                    }
                    break;
                }
                if (wire) {
                    city.calculate_power_grid_required = true;
                    city.update_power_grid_required = true;
                }
                if (p != null) {
                    if (left   > p.x1) left   = p.x1;
                    if (right  < p.x2) right  = p.x2;
                    if (top    > p.y1) top    = p.y1;
                    if (bottom < p.y2) bottom = p.y2;
                }
            }
        }
        if (current_build.name === 'wire') {
            city.calc_power_supply_append(left, top, right, bottom);
        }
        view.update_tile_range(city, left - 1, right + 1, top - 1, bottom + 1);
    }
    function build_tile() {
        if (view.cursor_x >= 0 && view.cursor_y >= 0) {
            switch (current_build_type) {
            case BUILD_TYPE_PEN1:
                build_tile_sub(view.cursor_x, view.cursor_x, view.cursor_y, view.cursor_y);
                break;
            case BUILD_TYPE_PEN3:
                build_tile_sub(view.cursor_x - 1, view.cursor_x + 1, view.cursor_y - 1, view.cursor_y + 1);
                break;
            }
        }
    }
    function build_range() {
        if (view.cursor_x >= 0 && view.cursor_y >= 0) {
            build_tile_sub(view.cursor_x_begin, view.cursor_x, view.cursor_y_begin, view.cursor_y);
        }
    }

    function show_title_screen_map(city, map_generator) {
        popup.reset();
        popup.set_title('generate_terrain');
        popup.show_ok_cancel('map_ok', 'map_cancel');
        popup.set_layout('canvas:' + (city.map_size * 2 + 2), 'list');
        popup.set_list_items({
            type: 'single',
            init: map_generator,
            items: [
                {text: 'land_clear'},
                {text: 'river'},
                {text: 'coast'},
                {text: 'lake'},
                {text: 'island'},
            ],
        });
    }
    function map_shift_up(c) {
        let p = c.tile_data;
        let size = c.map_size_edge;
        let end = size * (size - 2);
        for (let i = size; i < end; i++) {
            p[i] = p[i + size];
        }
    }
    function map_shift_down(c) {
        let p = c.tile_data;
        let size = c.map_size_edge;
        let end = size * 2;
        for (let i = size * (size - 1); i >= end; i--) {
            p[i] = p[i - size];
        }
    }
    function show_load_file(title) {
        popup.reset();
        popup.set_title(title);
        popup.show_ok_cancel('file_ok', 'file_cancel');
        popup.set_layout('canvas:' + (city_tmp.map_size * 2 + 2), 'svg');
        popup.draw_map_q(city_tmp);
        let list_items = [
            {raw_text: resource.datestr(city_tmp.year, city_tmp.month)},
            {raw_text: city_tmp.city_name},
            {},
            {title: 'funds', val: city_tmp.funds},
            {title: 'population', val: city_tmp.population},
            {title: 'ruleset', val: city_tmp.ruleset},
            {title: 'difficulty', val: city_tmp.difficulty},
        ];
        if (import_from === 'micropolis') {
            let offset = 10;
            list_items.push({});
            list_items.push({raw_text: 'OffsetY', val: 10, format:'input', id:'offset_y', on_down:e => {
                if (offset > 0) {
                    offset--;
                    map_shift_up(city_tmp);
                    popup.svg_list_values.offset_y.textContent = String(offset);
                    popup.draw_map_q(city_tmp);
                }
            }, on_up:e => {
                if (offset < 20) {
                    offset++;
                    map_shift_down(city_tmp);
                    popup.svg_list_values.offset_y.textContent = String(offset);
                    popup.draw_map_q(city_tmp);
                }
            }});
        }
        popup.set_svg_list(32, 32, 260, list_items);
    }
    function show_error_window(e) {
        popup.reset();
        popup.set_layout('text', null);
        popup.set_title_raw("Error");
        popup.set_text_content_raw(e.message);
    }
    function update_indicator() {
        document.getElementById('indicator-date').value = String(city.year);
        document.getElementById('indicator-funds').value = (city.difficulty !== 'creative' ? String(city.funds) : '∞');
        document.getElementById('indicator-cityname').value = city.city_name;
        document.getElementById('indicator-ruleset').value = city.ruleset;
        document.getElementById('indicator-difficulty').value = city.difficulty;
    }
    function init() {
        let generator = new GenerateMap();
        generator.set_city(city);
        view.init_maptip();
        generator.fill(M_LAND);
        view.set_tiles(city);
        current_build = build_icon_info[current_build_index];
        view.draw_terrain_icons();

        build_icon_hilight2.style.width = ICON_W + 'px';
        build_icon_hilight2.style.height = ICON_H + 'px';
        build_icon_hilight2.style.top = (ICON_H + 40) + 'px';

        update_menu_text();
        update_build_icons();
        update_minimap();

        city.city_name = document.getElementById('indicator-cityname').value;
    }


    document.getElementById('build-icons').addEventListener('click', e => {
        let idx = Math.floor((e.clientX - e.target.parentElement.offsetLeft) / 64);
        let row = ((e.clientY - e.target.parentElement.offsetTop) < 48) ? 0 : 1;
        if (build_icon_page === 1) {
            if (row === 0) {
                if (idx < build_icon_info.length) {
                    current_build_index = idx;
                }
            } else {
                if (idx < 4) {
                    current_build_type = idx;
                }
            }
        } else {
            let new_idx = idx * 2 + row;
            if (new_idx < build_icon_info.length) {
                current_build_index = new_idx;
            }
            current_build_type = BUILD_TYPE_PEN1;
        }
        current_build = build_icon_info[current_build_index];
        update_build_icons();
    });
    document.getElementById('button-next-page').setAttribute('style', 'cursor:pointer');
    document.getElementById('button-next-page').addEventListener('click', e => {
        switch (build_icon_page) {
        case 1:
            build_icon_page = 2;
            build_icon_info = BUILD_ICON_INFO_TERRAIN2;
            view.draw_build_icons(city, build_icon_info, 0);
            break;
        case 2:
            build_icon_page = 3;
            build_icon_info = BUILD_ICON_INFO_TERRAIN3;
            view.draw_build_icons(city, build_icon_info, 0);
            break;
        case 3:
            build_icon_page = 1;
            build_icon_info = BUILD_ICON_INFO_TERRAIN1;
            view.draw_terrain_icons();
            break;
        }
        current_build_index = 0;
        current_build = build_icon_info[0];
        update_build_icons();
    });

    main_view.addEventListener('mousedown', e => {
        if (e.button === 0) {
            if (current_build.name === 'road' || current_build.name === 'railroad' || current_build.name === 'wire') {
                let pos = view.cursor_x + 1 + (view.cursor_y + 1) * city.map_size_edge;
                if ((city.tile_data[pos] & M_LAND) === 0) {
                    if (city.tile_data[pos] === M_WATER) {
                        let p = city.build_tile_at(view.cursor_x, view.cursor_y, current_build);
                        if (p != null) {
                            view.update_tile_range(city, p.x1 - 1, p.x2 + 1, p.y1 - 1, p.y2 + 1);
                        }
                    }
                    return;
                }
            }
            lbuttondown = true;
            if (view.cursor_x >= 0) {
                if (current_build_type === BUILD_TYPE_RECT) {
                    view.set_begin_cursor(1);
                } else if (current_build_type === BUILD_TYPE_LINE) {
                    view.set_begin_cursor(2);
                } else {
                    build_tile();
                }
            }
        } else if (e.button === 2) {
            rbuttondown = true;
            view.begin_scroll(e.clientX, e.clientY);
        }
    });
    document.addEventListener('mouseup', e => {
        if (lbuttondown) {
            lbuttondown = false;
            if (current_build_type === BUILD_TYPE_RECT || current_build_type === BUILD_TYPE_LINE) {
                build_range();
            }
            view.set_end_cursor();
        }
        if (lbuttondown || rbuttondown) {
            rbuttondown = false;
        }
    });
    main_view.addEventListener('mousemove', e => {
        if (rbuttondown) {
            view.scroll(e.clientX, e.clientY);
            view.limit_scroll();
        } else {
            view.update_cursor_pos(e.clientX - main_view.offsetLeft, e.clientY - main_view.offsetTop);
            if (lbuttondown && current_build_type !== BUILD_TYPE_RECT) {
                build_tile();
            }
        }
        e.preventDefault();
    });
    main_view.addEventListener('mouseleave', e => {
        if (!lbuttondown && !rbuttondown) {
            view.cursor_x = -1;
            view.cursor_y = -1;
        }
        e.preventDefault();
    });
    document.addEventListener('wheel', e => {
        if (!popup.is_window_open) {
            view.zoom(e.clientX - main_view.offsetLeft, e.clientY - main_view.offsetTop, e.deltaY);
            view.update_minimap();
        }
    });

    document.getElementById('indicator-date').addEventListener('blur', e => {
        let year = parseInt(e.target.value, 10);
        if (isNaN(year)) {
            year = 1900;
        } else if (year < 1000) {
            year = 1000;
        } else if (year > 9999) {
            year = 9999;
        }
        city.year = year;
        update_indicator();
    });
    document.getElementById('indicator-funds').addEventListener('blur', e => {
        if (city.difficulty !== 'creative') {
            let funds = parseInt(e.target.value, 10);
            if (isNaN(funds) || funds < 5000) {
                funds = 5000;
            }
            city.funds = funds;
            update_indicator();
        }
    });
    document.getElementById('indicator-ruleset').addEventListener('change', e => {
        city.ruleset = e.target.value;
    });
    document.getElementById('indicator-difficulty').addEventListener('change', e => {
        city.difficulty = e.target.value;
        let fund = document.getElementById('indicator-funds');
        switch (city.difficulty) {
        case 'creative':
            city.funds = 'infinity';
            fund.value = '∞';
            fund.setAttribute('readonly', 'readonly');
            break;
        case 'peaceful':
        case 'novice':
            city.funds = 20000;
            fund.value = String(city.funds);
            fund.removeAttribute('readonly');
            break;
        case 'expert':
            city.funds = 10000;
            fund.value = String(city.funds);
            fund.removeAttribute('readonly');
            break;
        case 'master':
            city.funds = 5000;
            fund.value = String(city.funds);
            fund.removeAttribute('readonly');
            break;
        }
    });
    document.getElementById('indicator-cityname').addEventListener('blur', e => {
        let name = e.target.value;
        if (name === '') {
            let generator = new GenerateMap();
            name = generator.get_random_name();
            e.target.value = name;
        }
        city.city_name = name;
    });
    document.getElementById('menu-file').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('file');
        popup.set_layout('list', null);
        let file_menu_items = {
            type: 'single',
            init: '',
            items: [
                {text: 'load_file'},
                {text: 'import_mp'},
                {text: 'import_csv'},
                {text: 'save_file'},
            ],
        };
        popup.set_list_items(file_menu_items);
        popup.open(() => {
            switch (popup.get_selected()) {
            case 'load_file':
                import_from = null;
                popup.reset();
                popup.show_ok_cancel(null, 'drop_cancel');
                popup.set_title('load_file');
                popup.set_layout('drop', null);
                break;
            case 'import_mp':
                import_from = 'micropolis';
                popup.reset();
                popup.show_ok_cancel(null, 'drop_cancel');
                popup.set_title('import_mp');
                popup.set_layout('drop', null);
                break;
            case 'import_csv':
                import_from = 'csv';
                popup.reset();
                popup.show_ok_cancel(null, 'drop_cancel');
                popup.set_title('import_csv');
                popup.set_layout('drop', null);
                break;
            case 'save_file':
                popup.reset();
                popup.show_ok_cancel(null, 'download_cancel');
                popup.set_title('save_file');
                popup.set_layout('canvas:' + (city.map_size * 2 + 2), 'download');
                popup.draw_map_q(city);
                document.getElementById('file-download').textContent = resource.gettext('download');
                break;
            }
        }, mode => {
            switch (mode) {
            case 'file_ok':
                city = city_tmp;
                view.set_tiles(city);
                view.update_tile_rci(city);
                popup.close();
                update_indicator();
                city.calculate_power_grid_required = true;
                city.update_power_grid_required = true;
                break;
            case 'file_cancel':
                popup.reset();
                popup.show_ok_cancel(null, 'drop_cancel');
                popup.set_layout('drop', null);
                popup.set_title(import_from === 'csv' ? 'import_csv' : import_from === 'micropolis' ? 'import_mp' : 'load_file');
                break;
            case 'drop_cancel':
            case 'download_cancel':
                popup.reset();
                popup.show_close_button();
                popup.set_title('file');
                popup.set_layout('list', null);
                popup.set_list_items(file_menu_items);
                break;
            case 'close':
                popup.close();
                break;
            }
        });
    });
    document.getElementById('menu-generate_terrain').addEventListener('click', e => {
        let map_generator = 'land_clear';
        let new_city = null;
        let new_generator = null;

        popup.reset();
        popup.set_back_half_opacity();
        popup.show_ok_cancel('size_ok', 'size_cancel');
        popup.set_title('generate_terrain');
        popup.set_layout('list', null);
        let map_size_menu = {
            type: 'single',
            init: String(city.map_size),
            items: [
                {text: '40', text_raw:'40x40'},
                {text: '80', text_raw:'80x80'},
                {text: '120', text_raw:'120x120'},
                {text: '160', text_raw:'160x160'},
                {text: '200', text_raw:'200x200'},
            ],
        };
        popup.set_list_items(map_size_menu);
        popup.open(() => {
            let selected = popup.get_selected();
            switch (selected) {
            case 'land_clear':
                map_generator = selected;
                new_generator.fill(M_LAND);
                popup.draw_map_q(new_city);
                break;
            case 'river':
                map_generator = selected;
                new_generator.make_river();
                popup.draw_map_q(new_city);
                break;
            case 'coast':
                map_generator = selected;
                new_generator.make_coast();
                popup.draw_map_q(new_city);
                break;
            case 'lake':
                map_generator = selected;
                new_generator.make_lake();
                popup.draw_map_q(new_city);
                break;
            case 'island':
                map_generator = selected;
                new_generator.make_island();
                popup.draw_map_q(new_city);
                break;
            default:
                break;
            }
        }, mode => {
            switch (mode) {
            case 'size_ok':
                map_size_menu.init = popup.get_selected();
                new_city = new City(parseInt(map_size_menu.init), 10);
                new_generator = new GenerateMap();
                new_generator.set_city(new_city);
                show_title_screen_map(new_city, map_generator);
                popup.invoke();
                break;
            case 'size_cancel':
            case 'close':
                popup.close();
                break;
            case 'map_ok':
                new_city.copy_from(city);
                city = new_city;
                view.set_tiles(city);
                view.update_minimap();
                popup.close();
                break;
            case 'map_cancel':
                popup.reset();
                popup.set_title('generate_terrain');
                popup.show_ok_cancel('size_ok', 'size_cancel');
                popup.set_layout('list', null);
                popup.set_list_items(map_size_menu);
                break;
            }
        });
    });

    function parse_event(src) {
        let result = [];
        for (let i = 0; i < src.length; i++) {
            if (src[i] === '') {
                continue;
            }
            let a = src[i].split(/ +/);
            let evt = {};

            if (a[0] === 'gift') {
                evt.type = a[0];
                if (a[1] !== 'park_casino' && !BUILD_ICON_INFO_GIFT[a[1]]) {
                    throw new Error('Unknown gift "' + a[1] + '" at line ' + (i + 1));
                }
                evt.name = a[1];
            } else if (a[0] === 'disaster') {
                if (!DISASTERS[a[1]]) {
                    throw new Error('Unknown disaster "' + a[1] + '" at line ' + (i + 1));
                }
                evt.type = 'disaster';
                evt.name = a[1];
            } else {
                throw new Error('Unknown symbol "' + a[0] + '" at line ' + (i + 1));
            }
            if (a[2] !== 'if') {
                throw new Error('Syntax error at line ' + (i + 1));
            }
            evt.cond = [];
            for (let j = 3; j < a.length - 1; j += 3) {
                if (!EVENT_COND_SYMBOLS[a[j]]) {
                    throw new Error('Unknown symbol "' + a[j] + '" at line ' + (i + 1));
                }
                evt.cond.push(a[j]);
                let n = parseInt(a[j + 1], 10);
                if (isNaN(n)) {
                    throw new Error('Syntax error at line ' + (i + 1));
                }
                evt.cond.push(n);
                if (j + 2 < a.length && a[j + 2] !== 'and') {
                    throw new Error('Syntax error at line ' + (i + 1));
                }
            }
            result.push(evt);
        }
        return result;
    }
    document.getElementById('menu-scenario').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('scenario');
        popup.set_layout('enter-text-m', null);
        let text = '';
        for (let i = 0; i < city.event_reserved.length; i++) {
            let event = city.event_reserved[i];
            text += event.type + ' ' + event.name + ' if ';
            for (let j = 0; j < event.cond.length - 1; j += 2) {
                if (j > 0) {
                    text += 'and ';
                }
                text += event.cond[j] + ' ' + event.cond[j + 1];
            }
            text += "\n";
        }
        document.getElementById('enter-text-m').value = text;
        document.getElementById('popup-enter-name-button').textContent = resource.gettext('update');
        popup.open(null, mode => {
            switch (mode) {
            case 'close':
                popup.close();
                break;
            case 'enter_name_button':
                try {
                    city.event_reserved = parse_event(document.getElementById('enter-text-m').value.split("\n"));
                    popup.close();
                } catch (e) {
                    alert(e);
                }
                break;
            }
        });
    });
    function parse_election(src) {
        let a = src.split(/ +/);
        let evt = {};

        evt.year = parseInt(a[0]);
        if (isNaN(evt.year)) {
            throw new Error('Syntax error');
        }
        if (a[1] !== 'commitment') {
            throw new Error('Syntax error');
        }
        evt.cond = [];
        for (let j = 2; j < a.length - 1; j += 3) {
            if (!EVENT_COND_SYMBOLS[a[j]]) {
                throw new Error('Unknown symbol "' + a[j] + '"');
            }
            evt.cond.push(a[j]);
            let n = parseInt(a[j + 1], 10);
            if (isNaN(n)) {
                throw new Error('Syntax error');
            }
            evt.cond.push(n);
            if (j + 2 < a.length && a[j + 2] !== 'and') {
                throw new Error('Syntax error');
            }
        }
        return evt;
    }
    document.getElementById('menu-election').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('election');
        popup.set_layout('enter-text', null);
        let text = '';
        if (city.election != null) {
            text = city.election.year + ' commitment ';
            for (let j = 0; j < city.election.cond.length - 1; j += 2) {
                if (j > 0) {
                    text += ' and ';
                }
                text += city.election.cond[j] + ' ' + city.election.cond[j + 1];
            }
        }
        document.getElementById('enter-text').value = text;
        document.getElementById('popup-enter-name-button').textContent = resource.gettext('update');
        popup.open(null, mode => {
            switch (mode) {
            case 'close':
                popup.close();
                break;
            case 'enter_name_button':
                try {
                    let src = document.getElementById('enter-text').value;
                    if (src.length > 0) {
                        city.election = parse_election(src);
                    } else {
                        city.election = null;
                    }
                    popup.close();
                } catch (e) {
                    alert(e);
                }
                break;
            }
        });
    });
    document.getElementById('menu-language').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('language');
        popup.set_layout('list', null);
        popup.set_list_items({
            type: 'single',
            init: 'lang_' + resource.current_language,
            items: resource.language_menu,
        });
        popup.open(() => {
            let selected = popup.get_selected();
            selected = selected.substring(5);
            if (resource.current_language !== selected) {
                resource.set_language(selected, () => {
                    update_menu_text();
                    popup.close();
                });
            } else {
                popup.close();
            }
        }, mode => {
            popup.close();
        });
    });

    document.getElementById('minimap-cw').addEventListener('click', e => {
        city.rotate_cw();
        view.rotate_cw();
        view.update_tile_range(city, 0, city.map_size, 0, city.map_size);
        update_minimap();
    });
    document.getElementById('minimap-ccw').addEventListener('click', e => {
        city.rotate_ccw();
        view.rotate_ccw();
        view.update_tile_range(city, 0, city.map_size, 0, city.map_size);
        update_minimap();
    });
    document.getElementById('minimap-sw').addEventListener('click', e => {
        view.opaque_buildings = !view.opaque_buildings;
        document.getElementById('minimap-sw-back').setAttribute('style', 'fill:' + (view.opaque_buildings ? '#ffffff' : '#808080'));
    });
    function load_micropolis(buf) {
        // refer to https://github.com/SimHacker/micropolis/blob/master/MicropolisCore/src/MicropolisEngine/src/micropolis.h
        function get_uint16(buf, offset) {
            return (buf[offset] << 8) | buf[offset + 1];
        }
        function get_uint32(buf, offset) {
            return (buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3];
        }

        const MISC = 240 * 6 * 2;
        const MAP = MISC - 1320;

        if (buf.length !== 27120) {
            throw new Error("length=" + buf.length + " (wants 27120)");
        }

        let c = new City(120);
        c.funds = get_uint32(buf, MISC + 50 * 2);
        c.tax_rate = get_uint16(buf, MISC + 56 * 2);
        let time = get_uint32(buf, MISC + 8 * 2);
        c.year = 1900 + Math.floor(time / 48);
        c.month = 1;
        c.ruleset = 'micropolis';

        for (let y = 0; y < 100; y++) {
            let pos = 1 + (y + 11) * c.map_size_edge;
            for (let x = 0; x < 120; x++) {
                if (c.tile_data[pos + x] !== M_WATER) {
                    continue;
                }
                let tile = get_uint16(buf, (MAP + y + x * 100) * 2);
                let t = tile & 0x3ff;
                let cond = tile & 0x4000;
                let d = M_WATER;
                let size = 1;
                if (t <= 1) {
                    d = M_LAND;
                } else if ((t >= 21 && t <= 43) || (t >= 840 && t <= 843)) {
                    d = M_TREE;
                } else if ((t >= 44 && t <= 47)) {
                    d = M_RUBBLE;
                } else if (t === 64 || t === 65) {
                    d = M_ROAD_WT;
                } else if ((t >= 66 && t <= 78) || (t >= 80 && t <= 206)) {
                    if (cond !== 0) {
                        d = M_ROADWIRE;
                    } else {
                        d = M_ROAD;
                    }
                } else if (t === 77 || t === 78) {
                    d = M_ROADWIRE;
                } else if (t === 208 || t === 209) {
                    d = M_WIRE_WT;
                } else if (t >= 210 && t <= 220) {
                    d = M_WIRE;
                } else if (t === 221 || t === 222) {
                    d = M_RAILWIRE;
                } else if (t === 224 || t === 225) {
                    d = M_RAIL_WT;
                } else if (t >= 226 && t <= 236) {
                    d = M_RAIL;
                } else if (t === 237 || t === 238) {
                    d = M_ROADRAIL;
                } else if (t === 244 || t === 265) {
                    d = M_R_ZONE;
                    size = -3;
                } else if (t >= 266 && t <= 404) {
                    d = M_R_ZONE;
                    size = 3;
                } else if (t === 405) {
                    d = M_HOSPITAL;
                    size = 3;
                } else if (t === 414) {
                    d = M_SCHOOL;
                    size = 3;
                } else if (t === 427 || t === 436) {
                    d = M_C_ZONE;
                    size = -3;
                } else if (t >= 437 && t <= 609) {
                    d = M_C_ZONE;
                    size = 3;
                } else if (t === 616 || t === 621 || t === 625) {
                    d = M_I_ZONE;
                    size = -3;
                } else if (t >= 626 && t <= 689) {
                    d = M_I_ZONE;
                    size = 3;
                } else if (t === 693) {
                    d = M_PORT;
                    size = 4;
                } else if (t === 709) {
                    d = M_AIRPORT;
                    size = 6;
                } else if (t === 745) {
                    d = M_COAL_PWR;
                    size = 4;
                } else if (t === 761) {
                    d = M_FIRE_D;
                    size = 3;
                } else if (t === 770) {
                    d = M_POLICE_D;
                    size = 3;
                } else if (t === 784) {
                    d = M_STADIUM1;
                    size = -4;
                } else if (t === 800) {
                    d = M_STADIUM2;
                    size = -4;
                } else if (t === 811) {
                    d = M_NUKE_PWR;
                    size = 4;
                }
                if (size === 1) {
                    c.tile_data[pos + x] = d;
                } else if (size < 0) {
                    size = -size;
                    let center = Math.floor((size - 1) / 2);
                    for (let yy = -center; yy < size - center; yy++) {
                        for (let xx = -center; xx < size - center; xx++) {
                            c.tile_data[pos + (yy * c.map_size_edge) + x + xx] = d;
                        }
                    }
                    c.tile_data[pos + x] |= F_CENTER;
                } else {
                    for (let yy = 0; yy < size; yy++) {
                        for (let xx = 0; xx < size; xx++) {
                            c.tile_data[pos + (yy * c.map_size_edge) + x + xx] = d;
                        }
                    }
                    let center = Math.floor((size - 1) / 2);
                    c.tile_data[pos + (center * c.map_size_edge) + x + center] |= F_CENTER;
                }
            }
        }
        let src = 1 + 11 * c.map_size_edge;
        for (let y = 0; y < 10; y++) {
            let dst = 1 + (y + 1) * c.map_size_edge;
            for (let x = 0; x < 120; x++) {
                c.tile_data[dst + x] = c.tile_data[src + x] & M_LAND;
            }
        }
        src = 1 + 110 * c.map_size_edge;
        for (let y = 110; y < 120; y++) {
            let dst = 1 + (y + 1) * c.map_size_edge;
            for (let x = 0; x < 120; x++) {
                c.tile_data[dst + x] = c.tile_data[src + x] & M_LAND;
            }
        }
        return c;
    }
    function load_city_csv(src) {
        let lines = src.split('\n');
        for (let i = 0; i < lines.length; ) {
            let tmp = lines[i].trim();
            if (tmp.length > 0) {
                if (tmp.indexOf(',') >= 0) {
                    lines[i] = tmp.split(',');
                } else if (tmp.indexOf("\t") >= 0) {
                    lines[i] = tmp.split("\t");
                } else {
                    throw new Error("File format is not CSV nor TSV");
                }
                i++;
            } else {
                lines.splice(i, 1);
            }
        }
        let size = Math.floor((lines.length + 39) / 40) * 40;
        if (size > 200) {
            size = 200;
        }
        let c = new City(size);
        let tiles = c.tile_data;
        let size_edge = c.map_size_edge;

        function build_at(pos, t, l, u) {
            for (let y = l; y <= u; y++) {
                for (let x = l; x <= u; x++) {
                    tiles[pos + y * size_edge + x] = t;
                }
            }
            tiles[pos] |= F_CENTER;
        }

        for (let y = 0; y < size && y < lines.length; y++) {
            let line = lines[y];
            let n = size < line.length ? size : line.length;
            for (let x = 0; x < n; x++) {
                let i = 1 + x + (y + 1) * size_edge;
                switch (line[x]) {
                case '.':
                    tiles[i] = M_LAND;
                    break;
                case '-':
                    tiles[i] = M_WATER;
                    break;
                case 't':
                    tiles[i] = M_TREE;
                    break;
                case 'r':
                    tiles[i] = M_ROAD;
                    break;
                case 'm':
                    tiles[i] = M_RAIL;
                    break;
                case 'w':
                    tiles[i] = M_WIRE;
                    break;
                case 'ar':
                case 'ra':
                    tiles[i] = M_ROAD_WT;
                    break;
                case 'am':
                case 'ma':
                    tiles[i] = M_RAIL_WT;
                    break;
                case 'aw':
                case 'wa':
                    tiles[i] = M_WIRE_WT;
                    break;
                case 'rm':
                case 'mr':
                    tiles[i] = M_ROADRAIL;
                    break;
                case 'mw':
                case 'wm':
                    tiles[i] = M_RAILWIRE;
                    break;
                case 'rw':
                case 'wr':
                    tiles[i] = M_ROADWIRE;
                    break;
                case 'R':
                    build_at(i, M_R_ZONE, -1, 1);
                    break;
                case 'Rh':
                    build_at(i, M_HOSPITAL, -1, 1);
                    break;
                case 'Rs':
                    build_at(i, M_SCHOOL, -1, 1);
                    break;
                case 'C':
                    build_at(i, M_C_ZONE, -1, 1);
                    break;
                case 'I':
                    build_at(i, M_I_ZONE, -1, 1);
                    break;
                case 'PD':
                    build_at(i, M_POLICE_D, -1, 1);
                    break;
                case 'FD':
                    build_at(i, M_FIRE_D, -1, 1);
                    break;
                case 'ST':
                    build_at(i, M_STATION, -1, 1);
                    break;
                case 'S1':
                    build_at(i, M_STADIUM1, -1, 2);
                    break;
                case 'S2':
                    build_at(i, M_STADIUM2, -1, 2);
                    break;
                case 'P':
                    build_at(i, M_PORT, -1, 2);
                    break;
                case 'GS':
                    build_at(i, M_GOODS_ST, -1, 2);
                    break;
                case 'AP':
                    build_at(i, M_AIRPORT, -2, 3);
                    break;
                case 'CP':
                    build_at(i, M_COAL_PWR, -1, 2);
                    break;
                case 'GP':
                    build_at(i, M_GAS_PWR, -1, 2);
                    break;
                case 'NP':
                    build_at(i, M_NUKE_PWR, -1, 2);
                    break;
                case 'PQ':
                    build_at(i, M_POLICE_HQ, -1, 1);
                    break;
                case 'FQ':
                    build_at(i, M_FIRE_HQ, -1, 1);
                    break;
                case 'TST':
                    build_at(i, M_TERM_STN, -1, 1);
                    break;
                case 'AMS':
                    build_at(i, M_AMUSEMENT, -1, 1);
                    break;
                case 'CSN':
                    build_at(i, M_CASINO, -1, 1);
                    break;
                case 'ZOO':
                    build_at(i, M_ZOO, -1, 1);
                    break;
                case 'WML':
                    build_at(i, M_WINDMILL, -1, 1);
                    break;
                default:
                    break;
                }
            }
        }
        return c;
    }
    popup.callback_readfile = (file => {
        let fr = new FileReader();
        if (import_from === 'micropolis') {
            fr.addEventListener('load', e => {
                try {
                    city_tmp = load_micropolis(new Uint8Array(e.target.result));
                    city_tmp.month = 1;
                    city_tmp.ticks = 0;
                    city_tmp.city_name = file.name.replace(/\.[a-zA-Z]+$/, '');
                    show_load_file('import_mp');
                } catch (e) {
                    show_error_window(e);
                }
            });
            fr.readAsArrayBuffer(file);
        } else if (import_from === 'csv') {
            fr.addEventListener('load', e => {
                try {
                    city_tmp = load_city_csv(e.target.result);
                    show_load_file('import_csv');
                    city_tmp.city_name = file.name.replace(/\.[a-zA-Z]+$/, '');
                } catch (e) {
                    show_error_window(e);
                }
            });
            fr.readAsText(file);
        } else {
            fr.addEventListener('load', e => {
                try {
                    city_tmp = new City(JSON.parse(e.target.result));
                    city_tmp.month = 1;
                    show_load_file('load_file');
                } catch (e) {
                    // TODO
                    show_error_window(e);
                }
            });
            fr.readAsText(file);
        }
    });
    document.getElementById('file-download').addEventListener('click', e => {
        let a = e.target;
        let json = city.to_json();
        json.status = 'new';
        let blob = new Blob([JSON.stringify(json)], {type: "application/json"});
        a.href = URL.createObjectURL(blob);
    });

    document.addEventListener('contextmenu', e => {
        e.preventDefault();
    });
    window.setInterval(() => {
        if (!popup.is_window_open) {
            if (city.calculate_power_grid_required) {
                city.update_power_grid();
            }
            if (city.update_power_grid_required) {
                view.update_power_grid(city);
                city.update_power_grid_required = false;
            }
            view.draw_main();
        }
    }, 100);

    if (window.location.hash !== '') {
        resource.current_language = window.location.hash.substr(1);
    }
    resource.init(init);
});
