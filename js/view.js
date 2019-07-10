'use strict';

function View(quality)
{
    // d1 : row(dst)
    // d2 : col(src)
    const TRAIN_DIR = [
        0, 2, 0, 4,
        5, 1, 4, 1,
        0, 3, 0, 5,
        3, 1, 2, 1,
    ];

    const QTILE_SIZE = 64;
    const ICON_W = 64;
    const ICON_H = 48;
    const BUILD_ICONS_W = ICON_W * 11;
    const BUILD_ICONS_H = ICON_H * 2;

    const INDEX_TILE3  = 0x1000;
    const INDEX_TILE4  = 0x2000;
    const INDEX_TILE6  = 0x3000;
    const MASK_TILESIZE = 0x7000;
    const MASK_INDEX = 0x0fff;

    const INDEX_NONE = 0xffff;
    const INDEX_LAND = 0;
    const INDEX_FLOOD = 1;
    const INDEX_COAST = 2;
    const INDEX_RUBBLE = 11;
    const INDEX_BLACKOUT = 12;
    const INDEX_RADIO = 13;
    const INDEX_ROAD = 14;
    const INDEX_RAIL = 25;
    const INDEX_WIRE = 36;
    const INDEX_WIRE2 = 47;
    const INDEX_ROAD_RAIL = 49;
    const INDEX_ROAD_RAIL_U = 51;
    const INDEX_BRIDGE_BEGIN = 52;
    const INDEX_ROAD_BRIDGE = 52;
    const INDEX_RAIL_BRIDGE = 54;
    const INDEX_BRIDGE_END = 56;
    const INDEX_TREE = 56;      // 2
    const INDEX_FIRE = 58;      // 4
    const INDEX_R_ZONE_1 = 62;  // 4
    const INDEX_JAM_1010 = 66;  // 8
    const INDEX_JAM_0101 = 74;  // 8
    const INDEX_JAM_1100 = 82;  // 8
    const INDEX_JAM_0110 = 90;  // 8
    const INDEX_JAM_0011 = 98;  // 8
    const INDEX_JAM_1001 = 106; // 8
    const INDEX_R_ZONE_MARK = 114;
    const INDEX_C_ZONE_MARK = 115;
    const INDEX_I_ZONE_MARK = 116;

    const INDEX_TRAIN = 117;

    const INDEX_ROAD_BRIDGE_D = 1;
    const INDEX_ROAD_BRIDGE_U = 3;
    const INDEX_RAIL_BRIDGE_D = 5;
    const INDEX_RAIL_BRIDGE_U = 7;
    const INDEX_R_ZONE_D = 9;
    const INDEX_R_ZONE = 10;    // 16
    const INDEX_R_TOP = 26;     // 4
    const INDEX_C_ZONE_D = 30;
    const INDEX_C_ZONE = 31;    // 20
    const INDEX_C_TOP = 51;     // 4
    const INDEX_I_ZONE_D = 55;
    const INDEX_I_ZONE = 56;    // 8
    const INDEX_HOSPITAL = 64;
    const INDEX_SCHOOL = 65;
    const INDEX_STATION_RAIL = 66;
    const INDEX_STATION = 68;
    const INDEX_POLICE_DEPT = 70;
    const INDEX_FIRE_DEPT = 71;
    const INDEX_YOUR_HOUSE = 72;
    const INDEX_TML_STATION = 77;
    const INDEX_POLICE_HQ = 79;
    const INDEX_FIRE_HQ = 80;
    const INDEX_AMUSEMENT = 81;
    const INDEX_CASINO = 82;
    const INDEX_BANK = 83;
    const INDEX_M_STATUE = 84;
    const INDEX_ZOO = 85;
    const INDEX_MONOLITH = 86;
    const INDEX_LIBRARY = 87;
    const INDEX_WINDMILL = 88;
    const INDEX_TOWER = 92;
    const INDEX_GARDEN = 93;
    const INDEX_FOUNTAIN = 94;
    const INDEX_EXPO = 95;

    const INDEX_PAVED = 1;
    const INDEX_STADIUM = 2;
    const INDEX_GOODS_ST = 4;
    const INDEX_PORT_BASE = 8;
    const INDEX_PORT = 10;
    const INDEX_COAL_PWR = 14;
    const INDEX_GAS_PWR = 15;
    const INDEX_NUKE_PWR = 16;

    const INDEX_AIRPORT = 0;

    const INDEX_PLANE = 0;
    const INDEX_HELI = 8;
    const INDEX_SHIP = 16;
    const INDEX_TORNADO_CORE = 24;
    const INDEX_TORNADO = 25;
    const INDEX_MONSTER = 29;
    const INDEX_MONSTER_FIRE = 41;
    const INDEX_MONSTER_WATER = 45;
    const INDEX_UFO = 46;
    const INDEX_UFO_RAY = 48;

    const minimap_view_area = document.getElementById('minimap-view-area');

    let enable_redraw = true;
    let u_tiles = null;
    let d_tiles = null;
    let a_tiles = null;
    let c_tiles = null;
    let tile_fire = null;
    let map_size = 0;
    let map_size_edge = 0;
    let cursor_size = 1;

    let current_scroll_x = 0;
    let current_scroll_y = 0;
    let down_point_x = 0;
    let down_point_y = 0;
    let scale = 1;
    let minimap_update_required = true;
    let ticks = 0;

    this.cursor_x = -1;
    this.cursor_y = -1;
    this.cursor_x_begin = -1;
    this.cursor_y_begin = -1;
    this.cursor_drag_mode = 0;

    this.client_width = 0;
    this.client_height = 0;
    this.quality = quality;
    this.opaque_buildings = true;
    this.color_scheme = false;

    this.airplane = {
        dir: -1,
        x: -1, y: -1, z: -1,
        d: -1, dx: 0, dy: 0, dz: 0,
        landing: false,
    };
    this.helicopter = {
        dir: -1,
        x: -1, y: -1, z: -1,
        d: -1, dx: 0, dy: 0, dz: -1,
    };
    this.container_ship = {
        dir: -1,
        x: -1, y: -1, z: 0,
        d: -1, dx: 0, dy: 0, dz: 0,
    };
    this.train_ticks = -1;
    this.train = [
        {d1: -1, d2: -1, x: -1, y: -1},
        {d1: -1, d2: -1, x: -1, y: -1},
        {d1: -1, d2: -1, x: -1, y: -1},
        {d1: -1, d2: -1, x: -1, y: -1},
    ];
    this.tornado = {
        dir: -1,
        x: -1, y: -1,
        d: -1, dx: 0, dy: 0,
        scatter: [0, 0, 0, 0, 0, 0],
        spin: 0, dust: false,
    };
    this.monster = {
        dir: -1,
        x: -1, y: -1,
        d: -1, dx: 0, dy: 0,
        walk: 0, fire: false,
    };
    this.ufo_disaster = {
        dir: -1,
        x: -1, y: -1,
        cx: -1, cy: -1,
        ticks: -1,
    };

    let train_sort = [
        this.train[0],
        this.train[1],
        this.train[2],
        this.train[3],
    ];
    let message_ticker_count = 0;
    let message_ticker_priority = false;

    function set_canvas_size(cvs, w, h) {
        cvs.width = Math.floor(w * quality);
        cvs.height = Math.floor(h * quality);
        cvs.style.width = w + 'px';
        cvs.style.height = h + 'px';
    }
    function create_canvas(w, h) {
        const cvs = document.createElement('canvas');
        cvs.width = w * quality;
        cvs.height = h * quality;
        return cvs;
    }

    const main_view_wrapper = document.getElementById('main-view-wrapper');
    const main_view = document.getElementById('main-view');
    let main_view_ctx = null;

    const build_icons = document.getElementById('build-icons');
    set_canvas_size(build_icons, BUILD_ICONS_W, BUILD_ICONS_H);
    const build_icons_ctx = build_icons.getContext('2d');

    const build_icon_hilight = document.getElementById('build-icon-hilight');
    build_icon_hilight.style.width = ICON_W + 'px';
    build_icon_hilight.style.height = ICON_H + 'px';

    function draw_maptip_q(ctx, src, cx, cy, scale) {
        let transform = 'none';
        if (src.length >= 2 && typeof(src[0]) === 'string') {
            if (src.length >= 3) {
                transform = src[2];
                src = maptip[src[0]][src[1]];
            } else {
                transform = src[1];
                src = maptip[src[0]];
            }
        }
        let stroke = false;
        let fill = false;
        let dash = false;
        for (let i = 0; i < src.length; i++) {
            let c = src[i];
            if (c instanceof Array) {
                if (stroke || fill) {
                    ctx.beginPath();
                    for (let j = 0; j < c.length; j++) {
                        const d = c[j];
                        if (d instanceof Array) {
                            let x, y;
                            if (d.length >= 3) {
                                switch (transform) {
                                case 'none':
                                    x = (d[0] - d[1]) * 2;
                                    y = d[0] + d[1] - d[2] * 2;
                                    break;
                                case 'flip_x':
                                    x = (d[1] - d[0]) * 2;
                                    y = d[0] + d[1] - d[2] * 2;
                                    break;
                                case 'rot_cw':
                                    x = (-d[1] - d[0]) * 2;
                                    y = d[0] - d[1] - d[2] * 2;
                                    break;
                                case 'rot_180':
                                    x = (-d[0] + d[1]) * 2;
                                    y = -d[0] - d[1] - d[2] * 2;
                                    break;
                                case 'rot_ccw':
                                    x = (d[1] + d[0]) * 2;
                                    y = d[1] - d[0] - d[2] * 2;
                                    break;
                                case 'rot_cw45':
                                    x = -d[1] * 2.828;
                                    y = d[0] * 1.414 - d[2] * 2;
                                    break;
                                case 'rot_ccw45':
                                    x = d[0] * 2.828;
                                    y = d[1] * 1.414 - d[2] * 2;
                                    break;
                                }
                            } else {
                                x = d[0];
                                y = d[1];
                            }
                            if (j === 0) {
                                ctx.moveTo(x * scale + cx, y * scale + cy);
                            } else {
                                ctx.lineTo(x * scale + cx, y * scale + cy);
                            }
                        } else if (d === 'z') {
                            ctx.closePath();
                        }
                    }
                    if (stroke) {
                        ctx.stroke();
                    }
                    if (fill) {
                        ctx.fill();
                    }
                }
            } else {
                if (c.fill != null) {
                    if (c.fill instanceof Array) {
                    } else {
                        ctx.fillStyle = c.fill;
                        fill = true;
                    }
                } else {
                    fill = false;
                }
                if (c.stroke != null) {
                    ctx.strokeStyle = c.stroke;
                    stroke = true;
                    ctx.lineWidth = (c.lineWidth != null ? c.lineWidth : 1) * scale;
                } else {
                    stroke = false;
                }
                if (c.lineDash != null) {
                    let d = [];
                    for (let k = 0; k < c.lineDash.length; k++) {
                        d.push(c.lineDash[k] * scale);
                    }
                    ctx.setLineDash(d);
                    dash = true;
                } else if (dash) {
                    ctx.setLineDash([]);
                    dash = false;
                }
            }
        }
        if (dash) {
            ctx.setLineDash([]);
        }
    }
    function draw_maptip_fire(ctx, cx, cy, scale) {
        for (let i = 0; i < 64; i++) {
            let rx = Math.random() * 16 - 8;
            let ry = Math.random() * 16 - 8;
            let x = (rx - ry) * 2;
            let y = rx + ry;
            ctx.lineWidth = 3 * scale;
            ctx.strokeStyle = '#ff6040';
            ctx.beginPath();
            ctx.moveTo(x * scale + cx, y * scale + cy);
            ctx.lineTo(x * scale + cx, (y - 4) * scale + cy);
            ctx.stroke();

            ctx.lineWidth = 2 * scale;
            ctx.strokeStyle = '#ffff40';
            ctx.beginPath();
            ctx.moveTo(x * scale + cx, (y - 4) * scale + cy);
            ctx.lineTo(x * scale + cx, (y - 8) * scale + cy);
            ctx.stroke();
        }
    }

    function MipMap(n_width, n_height, n_elems) {
        const width = n_width * quality;
        const nwidth = width * n_elems;
        const height = n_height * quality;
        const cvs = document.createElement('canvas');
        cvs.width = nwidth;
        cvs.height = height * 1.5;
        const ctx = cvs.getContext('2d');

        let n_off_y = 0;
        let n_draw_off_x = 0;
        let n_draw_off_y = 0;
        let scale_off_x = 0;
        let scale_off_y = 0;
        let scale_w = width * scale;
        let scale_h = height * scale;

        this.update_scale = function() {
            if (scale >= 1) {
                scale_off_x = 0;
                scale_off_y = 0;
            } else if (scale >= 0.5) {
                scale_off_x = 0;
                scale_off_y = height;
            } else {
                scale_off_x = nwidth * 0.5;
                scale_off_y = height;
            }
            scale_w = width * scale;
            scale_h = height * scale;
        };
        this.set_offset_y = function(off_y, draw_off_x, draw_off_y) {
            n_off_y = 16 * quality * off_y;
            n_draw_off_x = 32 * quality * draw_off_x;
            n_draw_off_y = 16 * quality * draw_off_y;
        };
        this.clear = function() {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
        };
        this.set_qtile = function(idx, src, src2) {
            const w = (idx + 0.5) * width;
            const h = (height - n_off_y);
            draw_maptip_q(ctx, src, w, h, quality);
            draw_maptip_q(ctx, src, w * 0.5, h * 0.5 + height, quality * 0.5);
            draw_maptip_q(ctx, src, w * 0.25 + nwidth * 0.5, h * 0.25 + height, quality * 0.25);
            if (src2 != null) {
                draw_maptip_q(ctx, src2, w, h, quality);
                draw_maptip_q(ctx, src2, w * 0.5, h * 0.5 + height, quality * 0.5);
                draw_maptip_q(ctx, src2, w * 0.25 + nwidth * 0.5, h * 0.25 + height, quality * 0.25);
            }
        };
        this.set_fire = function(idx) {
            const w = (idx + 0.5) * width;
            const h = (height - n_off_y);
            draw_maptip_fire(ctx, w, h, quality);
            draw_maptip_fire(ctx, w * 0.5, h * 0.5 + height, quality * 0.5);
            draw_maptip_fire(ctx, w * 0.25 + nwidth * 0.5, h * 0.25 + height, quality * 0.25);
        };
        this.draw = function(dst, idx, cx, cy) {
            dst.drawImage(cvs, scale_off_x + scale_w * idx, scale_off_y, scale_w, scale_h, cx - scale_w * 0.5 + n_draw_off_x * scale, cy - scale_h + n_draw_off_y * scale, scale_w, scale_h);
        };
        this.draw_eqscale = function(dst, idx, cx, cy) {
            dst.drawImage(cvs, width * idx, 0, width, height, cx * quality - width * 0.5, cy * quality - height + n_draw_off_y, width, height);
        };
        this.drawtest = function(dst, x, y) {
            dst.drawImage(cvs, x, y);
        };
    }

    const mip1 = new MipMap(64, 32 * 3, 128);
    const mip3 = new MipMap(64 * 3, 32 * 5, 128);
    const mip4 = new MipMap(64 * 4, 32 * 7, 17);
    const mip6 = new MipMap(64 * 6, 32 * 8, 1);
    const mipt = new MipMap(64 * 3, 32 * 5, 64);

    function draw_square_q(ctx, color, x1, y1, x2, y2, q_scale, scroll_x, scroll_y) {
        const sq = q_scale * quality;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo((x1 - y1) * 2 * sq + scroll_x, (x1 + y1) * sq + scroll_y);
        ctx.lineTo((x2 - y1) * 2 * sq + scroll_x, (x2 + y1) * sq + scroll_y);
        ctx.lineTo((x2 - y2) * 2 * sq + scroll_x, (x2 + y2) * sq + scroll_y);
        ctx.lineTo((x1 - y2) * 2 * sq + scroll_x, (x1 + y2) * sq + scroll_y);
        ctx.closePath();
        ctx.fill();
    }

    this.init_maptip = function() {
        mip1.set_offset_y(2, 0, 2);
        mip1.clear();

        mip1.set_qtile(INDEX_LAND, maptip.land1, maptip.land1_edge);
        mip1.set_qtile(INDEX_FLOOD, maptip.flood, null);
        mip1.set_qtile(INDEX_RUBBLE, maptip.rubble, maptip.land1_edge);
        mip1.set_qtile(INDEX_BLACKOUT, maptip.blackout, null);
        mip1.set_qtile(INDEX_RADIO, maptip.radio, null);

        mip1.set_qtile(INDEX_COAST + 0, maptip.coast_1100, null);
        mip1.set_qtile(INDEX_COAST + 1, maptip.coast_0110, null);
        mip1.set_qtile(INDEX_COAST + 2, maptip.coast_0011, null);
        mip1.set_qtile(INDEX_COAST + 3, maptip.coast_1001, null);
        mip1.set_qtile(INDEX_COAST + 4, maptip.coast_1110, null);
        mip1.set_qtile(INDEX_COAST + 5, maptip.coast_0111, null);
        mip1.set_qtile(INDEX_COAST + 6, maptip.coast_1011, null);
        mip1.set_qtile(INDEX_COAST + 7, maptip.coast_1101, null);
        mip1.set_qtile(INDEX_COAST + 8, maptip.coast_1111, null);

        mip1.set_qtile(INDEX_ROAD + 0, maptip.road_1010, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 1, maptip.road_0101, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 2, maptip.road_1100, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 3, maptip.road_0110, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 4, maptip.road_0011, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 5, maptip.road_1001, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 6, maptip.road_0111, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 7, maptip.road_1011, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 8, maptip.road_1101, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD + 9, maptip.road_1110, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD +10, maptip.road_1111, maptip.land1_edge);

        mip1.set_qtile(INDEX_RAIL + 0, maptip.rail_1010, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 1, maptip.rail_0101, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 2, maptip.rail_1100, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 3, maptip.rail_0110, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 4, maptip.rail_0011, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 5, maptip.rail_1001, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 6, maptip.rail_0111, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 7, maptip.rail_1011, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 8, maptip.rail_1101, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL + 9, maptip.rail_1110, maptip.land1_edge);
        mip1.set_qtile(INDEX_RAIL +10, maptip.rail_1111, maptip.land1_edge);

        mip1.set_qtile(INDEX_WIRE + 0, maptip.wire_1010, null);
        mip1.set_qtile(INDEX_WIRE + 1, maptip.wire_0101, null);
        mip1.set_qtile(INDEX_WIRE + 2, maptip.wire_1100, null);
        mip1.set_qtile(INDEX_WIRE + 3, maptip.wire_0110, null);
        mip1.set_qtile(INDEX_WIRE + 4, maptip.wire_0011, null);
        mip1.set_qtile(INDEX_WIRE + 5, maptip.wire_1001, null);
        mip1.set_qtile(INDEX_WIRE + 6, maptip.wire_0111, null);
        mip1.set_qtile(INDEX_WIRE + 7, maptip.wire_1011, null);
        mip1.set_qtile(INDEX_WIRE + 8, maptip.wire_1101, null);
        mip1.set_qtile(INDEX_WIRE + 9, maptip.wire_1110, null);
        mip1.set_qtile(INDEX_WIRE +10, maptip.wire_1111, null);

        mip1.set_qtile(INDEX_WIRE2 + 0, maptip.wire2_1010, null);
        mip1.set_qtile(INDEX_WIRE2 + 1, maptip.wire2_0101, null);

        mip1.set_qtile(INDEX_ROAD_RAIL + 0, maptip.road_rail_1010, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD_RAIL + 1, maptip.road_rail_0101, maptip.land1_edge);
        mip1.set_qtile(INDEX_ROAD_RAIL_U, maptip.road_rail_u, null);

        mip1.set_qtile(INDEX_ROAD_BRIDGE + 0, maptip.road_1010, null);
        mip1.set_qtile(INDEX_ROAD_BRIDGE + 1, maptip.road_0101, null);

        mip1.set_qtile(INDEX_RAIL_BRIDGE + 0, maptip.rail_bridge_1010, null);
        mip1.set_qtile(INDEX_RAIL_BRIDGE + 1, maptip.rail_bridge_0101, null);

        mip1.set_qtile(INDEX_TREE, maptip.tree, null);
        mip1.set_fire(INDEX_FIRE + 0);
        mip1.set_fire(INDEX_FIRE + 1);
        mip1.set_fire(INDEX_FIRE + 2);
        mip1.set_fire(INDEX_FIRE + 3);

        mip1.set_qtile(INDEX_R_ZONE_1 + 0, maptip.r_11, null);
        mip1.set_qtile(INDEX_R_ZONE_1 + 1, maptip.r_12, null);
        mip1.set_qtile(INDEX_R_ZONE_1 + 2, maptip.r_13, null);
        mip1.set_qtile(INDEX_R_ZONE_1 + 3, maptip.r_14, null);

        mip1.set_qtile(INDEX_R_ZONE_MARK, resource.gettext('vec_r_mark'), null);
        mip1.set_qtile(INDEX_C_ZONE_MARK, resource.gettext('vec_c_mark'), null);
        mip1.set_qtile(INDEX_I_ZONE_MARK, resource.gettext('vec_i_mark'), null);

        mip1.set_qtile(INDEX_JAM_1010 + 0, maptip.road_jam10_1010, null);
        mip1.set_qtile(INDEX_JAM_1010 + 1, maptip.road_jam11_1010, null);
        mip1.set_qtile(INDEX_JAM_1010 + 2, maptip.road_jam12_1010, null);
        mip1.set_qtile(INDEX_JAM_1010 + 3, maptip.road_jam13_1010, null);
        mip1.set_qtile(INDEX_JAM_1010 + 4, maptip.road_jam20_1010, null);
        mip1.set_qtile(INDEX_JAM_1010 + 5, maptip.road_jam21_1010, null);
        mip1.set_qtile(INDEX_JAM_1010 + 6, maptip.road_jam22_1010, null);
        mip1.set_qtile(INDEX_JAM_1010 + 7, maptip.road_jam23_1010, null);
        mip1.set_qtile(INDEX_JAM_0101 + 0, maptip.road_jam10_0101, null);
        mip1.set_qtile(INDEX_JAM_0101 + 1, maptip.road_jam11_0101, null);
        mip1.set_qtile(INDEX_JAM_0101 + 2, maptip.road_jam12_0101, null);
        mip1.set_qtile(INDEX_JAM_0101 + 3, maptip.road_jam13_0101, null);
        mip1.set_qtile(INDEX_JAM_0101 + 4, maptip.road_jam20_0101, null);
        mip1.set_qtile(INDEX_JAM_0101 + 5, maptip.road_jam21_0101, null);
        mip1.set_qtile(INDEX_JAM_0101 + 6, maptip.road_jam22_0101, null);
        mip1.set_qtile(INDEX_JAM_0101 + 7, maptip.road_jam23_0101, null);
        mip1.set_qtile(INDEX_JAM_1100 + 0, maptip.road_jam10_1100, null);
        mip1.set_qtile(INDEX_JAM_1100 + 1, maptip.road_jam11_1100, null);
        mip1.set_qtile(INDEX_JAM_1100 + 2, maptip.road_jam12_1100, null);
        mip1.set_qtile(INDEX_JAM_1100 + 3, maptip.road_jam13_1100, null);
        mip1.set_qtile(INDEX_JAM_1100 + 4, maptip.road_jam20_1100, null);
        mip1.set_qtile(INDEX_JAM_1100 + 5, maptip.road_jam21_1100, null);
        mip1.set_qtile(INDEX_JAM_1100 + 6, maptip.road_jam22_1100, null);
        mip1.set_qtile(INDEX_JAM_1100 + 7, maptip.road_jam23_1100, null);
        mip1.set_qtile(INDEX_JAM_0110 + 0, maptip.road_jam10_0110, null);
        mip1.set_qtile(INDEX_JAM_0110 + 1, maptip.road_jam11_0110, null);
        mip1.set_qtile(INDEX_JAM_0110 + 2, maptip.road_jam12_0110, null);
        mip1.set_qtile(INDEX_JAM_0110 + 3, maptip.road_jam13_0110, null);
        mip1.set_qtile(INDEX_JAM_0110 + 4, maptip.road_jam20_0110, null);
        mip1.set_qtile(INDEX_JAM_0110 + 5, maptip.road_jam21_0110, null);
        mip1.set_qtile(INDEX_JAM_0110 + 6, maptip.road_jam22_0110, null);
        mip1.set_qtile(INDEX_JAM_0110 + 7, maptip.road_jam23_0110, null);
        mip1.set_qtile(INDEX_JAM_0011 + 0, maptip.road_jam10_0011, null);
        mip1.set_qtile(INDEX_JAM_0011 + 1, maptip.road_jam11_0011, null);
        mip1.set_qtile(INDEX_JAM_0011 + 2, maptip.road_jam12_0011, null);
        mip1.set_qtile(INDEX_JAM_0011 + 3, maptip.road_jam13_0011, null);
        mip1.set_qtile(INDEX_JAM_0011 + 4, maptip.road_jam20_0011, null);
        mip1.set_qtile(INDEX_JAM_0011 + 5, maptip.road_jam21_0011, null);
        mip1.set_qtile(INDEX_JAM_0011 + 6, maptip.road_jam22_0011, null);
        mip1.set_qtile(INDEX_JAM_0011 + 7, maptip.road_jam23_0011, null);
        mip1.set_qtile(INDEX_JAM_1001 + 0, maptip.road_jam10_1001, null);
        mip1.set_qtile(INDEX_JAM_1001 + 1, maptip.road_jam11_1001, null);
        mip1.set_qtile(INDEX_JAM_1001 + 2, maptip.road_jam12_1001, null);
        mip1.set_qtile(INDEX_JAM_1001 + 3, maptip.road_jam13_1001, null);
        mip1.set_qtile(INDEX_JAM_1001 + 4, maptip.road_jam20_1001, null);
        mip1.set_qtile(INDEX_JAM_1001 + 5, maptip.road_jam21_1001, null);
        mip1.set_qtile(INDEX_JAM_1001 + 6, maptip.road_jam22_1001, null);
        mip1.set_qtile(INDEX_JAM_1001 + 7, maptip.road_jam23_1001, null);

        mip1.set_qtile(INDEX_TRAIN + 0, maptip.train_0, null);
        mip1.set_qtile(INDEX_TRAIN + 1, maptip.train_1, null);
        mip1.set_qtile(INDEX_TRAIN + 2, maptip.train_2, null);
        mip1.set_qtile(INDEX_TRAIN + 3, maptip.train_3, null);
        mip1.set_qtile(INDEX_TRAIN + 4, maptip.train_4, null);
        mip1.set_qtile(INDEX_TRAIN + 5, maptip.train_5, null);


        mip3.set_offset_y(4, 0, 4);
        mip3.clear();

        mip3.set_qtile(INDEX_LAND, maptip.land3, maptip.land3_edge);
        mip3.set_qtile(INDEX_FLOOD, maptip.flood, null);
        mip3.set_qtile(INDEX_ROAD_BRIDGE_D + 0, maptip.road_bridge_d_1010, null);
        mip3.set_qtile(INDEX_ROAD_BRIDGE_D + 1, maptip.road_bridge_d_0101, null);
        mip3.set_qtile(INDEX_ROAD_BRIDGE_U + 0, maptip.road_bridge_u_1010, null);
        mip3.set_qtile(INDEX_ROAD_BRIDGE_U + 1, maptip.road_bridge_u_0101, null);
        mip3.set_qtile(INDEX_RAIL_BRIDGE_D + 0, maptip.rail_bridge_d_1010, null);
        mip3.set_qtile(INDEX_RAIL_BRIDGE_D + 1, maptip.rail_bridge_d_0101, null);
        mip3.set_qtile(INDEX_RAIL_BRIDGE_U + 0, maptip.rail_bridge_u_1010, null);
        mip3.set_qtile(INDEX_RAIL_BRIDGE_U + 1, maptip.rail_bridge_u_0101, null);
        mip3.set_qtile(INDEX_R_ZONE_D, maptip.r_frame, maptip.land3_edge);
        mip3.set_qtile(INDEX_R_ZONE + 0, maptip.r_21, null);
        mip3.set_qtile(INDEX_R_ZONE + 1, maptip.r_31, null);
        mip3.set_qtile(INDEX_R_ZONE + 2, maptip.r_41, null);
        mip3.set_qtile(INDEX_R_ZONE + 3, maptip.r_51, null);
        mip3.set_qtile(INDEX_R_ZONE + 4, maptip.r_22, null);
        mip3.set_qtile(INDEX_R_ZONE + 5, maptip.r_32, null);
        mip3.set_qtile(INDEX_R_ZONE + 6, maptip.r_42, null);
        mip3.set_qtile(INDEX_R_ZONE + 7, maptip.r_52, null);
        mip3.set_qtile(INDEX_R_ZONE + 8, maptip.r_23, null);
        mip3.set_qtile(INDEX_R_ZONE + 9, maptip.r_33, null);
        mip3.set_qtile(INDEX_R_ZONE +10, maptip.r_43, null);
        mip3.set_qtile(INDEX_R_ZONE +11, maptip.r_53, null);
        mip3.set_qtile(INDEX_R_ZONE +12, maptip.r_24, null);
        mip3.set_qtile(INDEX_R_ZONE +13, maptip.r_34, null);
        mip3.set_qtile(INDEX_R_ZONE +14, maptip.r_44, null);
        mip3.set_qtile(INDEX_R_ZONE +15, maptip.r_54, null);
        mip3.set_qtile(INDEX_R_TOP  + 0, maptip.r_top_n, null);
        mip3.set_qtile(INDEX_R_TOP  + 1, maptip.r_top_e, null);
        mip3.set_qtile(INDEX_R_TOP  + 2, maptip.r_top_s, null);
        mip3.set_qtile(INDEX_R_TOP  + 3, maptip.r_top_w, null);
        mip3.set_qtile(INDEX_C_ZONE_D, maptip.c_frame, maptip.land3_edge);
        mip3.set_qtile(INDEX_C_ZONE + 0, maptip.c_11, null);
        mip3.set_qtile(INDEX_C_ZONE + 1, maptip.c_21, null);
        mip3.set_qtile(INDEX_C_ZONE + 2, maptip.c_31, null);
        mip3.set_qtile(INDEX_C_ZONE + 3, maptip.c_41, null);
        mip3.set_qtile(INDEX_C_ZONE + 4, maptip.c_51, null);
        mip3.set_qtile(INDEX_C_ZONE + 5, maptip.c_12, null);
        mip3.set_qtile(INDEX_C_ZONE + 6, maptip.c_22, null);
        mip3.set_qtile(INDEX_C_ZONE + 7, maptip.c_32, null);
        mip3.set_qtile(INDEX_C_ZONE + 8, maptip.c_42, null);
        mip3.set_qtile(INDEX_C_ZONE + 9, maptip.c_52, null);
        mip3.set_qtile(INDEX_C_ZONE +10, maptip.c_13, null);
        mip3.set_qtile(INDEX_C_ZONE +11, maptip.c_23, null);
        mip3.set_qtile(INDEX_C_ZONE +12, maptip.c_33, null);
        mip3.set_qtile(INDEX_C_ZONE +13, maptip.c_43, null);
        mip3.set_qtile(INDEX_C_ZONE +14, maptip.c_53, null);
        mip3.set_qtile(INDEX_C_ZONE +15, maptip.c_14, null);
        mip3.set_qtile(INDEX_C_ZONE +16, maptip.c_24, null);
        mip3.set_qtile(INDEX_C_ZONE +17, maptip.c_34, null);
        mip3.set_qtile(INDEX_C_ZONE +18, maptip.c_44, null);
        mip3.set_qtile(INDEX_C_ZONE +19, maptip.c_54, null);
        mip3.set_qtile(INDEX_C_TOP  + 0, maptip.c_top_n, null);
        mip3.set_qtile(INDEX_C_TOP  + 1, maptip.c_top_e, null);
        mip3.set_qtile(INDEX_C_TOP  + 2, maptip.c_top_s, null);
        mip3.set_qtile(INDEX_C_TOP  + 3, maptip.c_top_w, null);
        mip3.set_qtile(INDEX_I_ZONE_D, maptip.i_frame, maptip.land3_edge);
        mip3.set_qtile(INDEX_I_ZONE + 0, maptip.i_11, null);
        mip3.set_qtile(INDEX_I_ZONE + 1, maptip.i_21, null);
        mip3.set_qtile(INDEX_I_ZONE + 2, maptip.i_31, null);
        mip3.set_qtile(INDEX_I_ZONE + 3, maptip.i_41, null);
        mip3.set_qtile(INDEX_I_ZONE + 4, maptip.i_12, null);
        mip3.set_qtile(INDEX_I_ZONE + 5, maptip.i_22, null);
        mip3.set_qtile(INDEX_I_ZONE + 6, maptip.i_32, null);
        mip3.set_qtile(INDEX_I_ZONE + 7, maptip.i_42, null);
        mip3.set_qtile(INDEX_HOSPITAL, maptip.hospital, null);
        mip3.set_qtile(INDEX_SCHOOL, maptip.school, null);
        mip3.set_qtile(INDEX_STATION_RAIL + 0, maptip.station_rail_ns, maptip.land3_edge);
        mip3.set_qtile(INDEX_STATION_RAIL + 1, maptip.station_rail_we, maptip.land3_edge);
        mip3.set_qtile(INDEX_STATION + 0, maptip.station_ns, null);
        mip3.set_qtile(INDEX_STATION + 1, maptip.station_we, null);
        mip3.set_qtile(INDEX_POLICE_DEPT, maptip.police_dept, null);
        mip3.set_qtile(INDEX_FIRE_DEPT, maptip.fire_dept, null);
        mip3.set_qtile(INDEX_YOUR_HOUSE + 0, maptip.your_house1, null);
        mip3.set_qtile(INDEX_YOUR_HOUSE + 1, maptip.your_house2, null);
        mip3.set_qtile(INDEX_YOUR_HOUSE + 2, maptip.your_house3, null);
        mip3.set_qtile(INDEX_YOUR_HOUSE + 3, maptip.your_house4, null);
        mip3.set_qtile(INDEX_YOUR_HOUSE + 4, maptip.your_house5, null);
        mip3.set_qtile(INDEX_TML_STATION + 0, maptip.tstation_ns, null);
        mip3.set_qtile(INDEX_TML_STATION + 1, maptip.tstation_we, null);
        mip3.set_qtile(INDEX_POLICE_HQ, maptip.police_hq, null);
        mip3.set_qtile(INDEX_FIRE_HQ, maptip.fire_hq, null);
        mip3.set_qtile(INDEX_AMUSEMENT, maptip.amusement_park, null);
        mip3.set_qtile(INDEX_CASINO, maptip.casino, null);
        mip3.set_qtile(INDEX_BANK, maptip.bank, null);
        mip3.set_qtile(INDEX_M_STATUE, maptip.monster_statue, null);
        mip3.set_qtile(INDEX_ZOO, maptip.zoo, null);
        mip3.set_qtile(INDEX_MONOLITH, maptip.monolith, null);
        mip3.set_qtile(INDEX_LIBRARY, maptip.library, null);
        mip3.set_qtile(INDEX_WINDMILL + 0, maptip.windmill_0, null);
        mip3.set_qtile(INDEX_WINDMILL + 1, maptip.windmill_1, null);
        mip3.set_qtile(INDEX_WINDMILL + 2, maptip.windmill_2, null);
        mip3.set_qtile(INDEX_WINDMILL + 3, maptip.windmill_3, null);
        mip3.set_qtile(INDEX_TOWER, maptip.tower, null);
        mip3.set_qtile(INDEX_GARDEN, maptip.garden, null);
        mip3.set_qtile(INDEX_FOUNTAIN + 0, maptip.fountain_0, null);
        mip3.set_qtile(INDEX_FOUNTAIN + 1, maptip.fountain_1, null);
        mip3.set_qtile(INDEX_EXPO, maptip.expo, null);


        mip4.set_offset_y(7, 1, 7);
        mip4.clear();

        mip4.set_qtile(INDEX_LAND, maptip.land4, maptip.land4_edge);
        mip4.set_qtile(INDEX_PAVED, maptip.paved4, maptip.land4_edge);
        mip4.set_qtile(INDEX_STADIUM + 0, maptip.stadium1, null);
        mip4.set_qtile(INDEX_STADIUM + 1, maptip.stadium2, null);
        mip4.set_qtile(INDEX_GOODS_ST + 0, maptip.goods_st_ns, maptip.land4_edge);
        mip4.set_qtile(INDEX_GOODS_ST + 1, maptip.goods_st_we, maptip.land4_edge);
        mip4.set_qtile(INDEX_GOODS_ST + 2, maptip.goods_st_cargo_ns, null);
        mip4.set_qtile(INDEX_GOODS_ST + 3, maptip.goods_st_cargo_we, null);
        mip4.set_qtile(INDEX_PORT_BASE + 0, maptip.port_base_ns, maptip.land4_edge);
        mip4.set_qtile(INDEX_PORT_BASE + 1, maptip.port_base_we, maptip.land4_edge);
        mip4.set_qtile(INDEX_PORT + 0, maptip.port_crane_ns, null);
        mip4.set_qtile(INDEX_PORT + 1, maptip.port_crane_we, null);
        mip4.set_qtile(INDEX_PORT + 2, maptip.port_cargo_ns, null);
        mip4.set_qtile(INDEX_PORT + 3, maptip.port_cargo_we, null);
        mip4.set_qtile(INDEX_COAL_PWR, maptip.coal_power, null);
        mip4.set_qtile(INDEX_GAS_PWR, maptip.gas_power, null);
        mip4.set_qtile(INDEX_NUKE_PWR, maptip.nuke_power, null);

        mip6.set_offset_y(8, 1, 8);
        mip6.clear();

        mip6.set_qtile(INDEX_AIRPORT, maptip.airport, maptip.land6_edge);


        mipt.set_offset_y(4, 0, 4);
        mipt.clear();

        mipt.set_qtile(INDEX_PLANE + 0, maptip.plane_0, null);
        mipt.set_qtile(INDEX_PLANE + 1, maptip.plane_1, null);
        mipt.set_qtile(INDEX_PLANE + 2, maptip.plane_2, null);
        mipt.set_qtile(INDEX_PLANE + 3, maptip.plane_3, null);
        mipt.set_qtile(INDEX_PLANE + 4, maptip.plane_4, null);
        mipt.set_qtile(INDEX_PLANE + 5, maptip.plane_5, null);
        mipt.set_qtile(INDEX_PLANE + 6, maptip.plane_6, null);
        mipt.set_qtile(INDEX_PLANE + 7, maptip.plane_7, null);
        mipt.set_qtile(INDEX_HELI + 0, maptip.heli_0, null);
        mipt.set_qtile(INDEX_HELI + 1, maptip.heli_1, null);
        mipt.set_qtile(INDEX_HELI + 2, maptip.heli_2, null);
        mipt.set_qtile(INDEX_HELI + 3, maptip.heli_3, null);
        mipt.set_qtile(INDEX_HELI + 4, maptip.heli_4, null);
        mipt.set_qtile(INDEX_HELI + 5, maptip.heli_5, null);
        mipt.set_qtile(INDEX_HELI + 6, maptip.heli_6, null);
        mipt.set_qtile(INDEX_HELI + 7, maptip.heli_7, null);
        mipt.set_qtile(INDEX_SHIP + 0, maptip.ship_0, null);
        mipt.set_qtile(INDEX_SHIP + 1, maptip.ship_1, null);
        mipt.set_qtile(INDEX_SHIP + 2, maptip.ship_2, null);
        mipt.set_qtile(INDEX_SHIP + 3, maptip.ship_3, null);
        mipt.set_qtile(INDEX_SHIP + 4, maptip.ship_4, null);
        mipt.set_qtile(INDEX_SHIP + 5, maptip.ship_5, null);
        mipt.set_qtile(INDEX_SHIP + 6, maptip.ship_6, null);
        mipt.set_qtile(INDEX_SHIP + 7, maptip.ship_7, null);

        mipt.set_qtile(INDEX_TORNADO_CORE, maptip.tornado_core, null);
        mipt.set_qtile(INDEX_TORNADO + 0, maptip.tornado_0, null);
        mipt.set_qtile(INDEX_TORNADO + 1, maptip.tornado_1, null);
        mipt.set_qtile(INDEX_TORNADO + 2, maptip.tornado_2, null);
        mipt.set_qtile(INDEX_TORNADO + 3, maptip.tornado_3, null);

        mipt.set_qtile(INDEX_MONSTER +  0, maptip.monster_00, null);
        mipt.set_qtile(INDEX_MONSTER +  1, maptip.monster_01, null);
        mipt.set_qtile(INDEX_MONSTER +  2, maptip.monster_02, null);
        mipt.set_qtile(INDEX_MONSTER +  3, maptip.monster_03, null);
        mipt.set_qtile(INDEX_MONSTER +  4, maptip.monster_10, null);
        mipt.set_qtile(INDEX_MONSTER +  5, maptip.monster_11, null);
        mipt.set_qtile(INDEX_MONSTER +  6, maptip.monster_12, null);
        mipt.set_qtile(INDEX_MONSTER +  7, maptip.monster_13, null);
        mipt.set_qtile(INDEX_MONSTER +  8, maptip.monster_20, null);
        mipt.set_qtile(INDEX_MONSTER +  9, maptip.monster_21, null);
        mipt.set_qtile(INDEX_MONSTER + 10, maptip.monster_22, null);
        mipt.set_qtile(INDEX_MONSTER + 11, maptip.monster_23, null);
        mipt.set_qtile(INDEX_MONSTER_FIRE +  0, maptip.monster_b0, null);
        mipt.set_qtile(INDEX_MONSTER_FIRE +  1, maptip.monster_b1, null);
        mipt.set_qtile(INDEX_MONSTER_FIRE +  2, maptip.monster_b2, null);
        mipt.set_qtile(INDEX_MONSTER_FIRE +  3, maptip.monster_b3, null);
        mipt.set_qtile(INDEX_MONSTER_WATER, maptip.monster_water, null);

        mipt.set_qtile(INDEX_UFO + 0, maptip.ufo_0, null);
        mipt.set_qtile(INDEX_UFO + 1, maptip.ufo_1, null);
        mipt.set_qtile(INDEX_UFO_RAY, maptip.ufo_ray, null);
    };
    this.draw_maptip = function(ctx, idx, x, y) {
        switch (idx & MASK_TILESIZE) {
        case 0:
            mip1.draw(ctx, idx, x, y);
            break;
        case INDEX_TILE3:
            mip3.draw(ctx, (idx & MASK_INDEX), x, y);
            break;
        case INDEX_TILE4:
            mip4.draw(ctx, (idx & MASK_INDEX), x, y);
            break;
        case INDEX_TILE6:
            mip6.draw(ctx, (idx & MASK_INDEX), x, y);
            break;
        }
    };
    this.draw_maptip_inspect = function(cvs, ix, iy, x, y) {
        let ctx = cvs.getContext('2d');
        let pos = ix + iy * map_size;
        let idx_d = d_tiles[pos];
        let idx_u = u_tiles[pos];

        if (idx_d === INDEX_NONE ||
            (idx_d >= INDEX_BRIDGE_BEGIN && idx_d < INDEX_BRIDGE_END) ||
            (idx_d >= INDEX_COAST && idx_d < INDEX_COAST + 9))
        {
            draw_square_q(ctx, '#4060ff', 0, 0, 16, 16, 1, x, y);
        } else if (idx_d === (INDEX_ROAD_BRIDGE_D | INDEX_TILE3) || idx_d === (INDEX_RAIL_BRIDGE_D | INDEX_TILE3)) {
            draw_square_q(ctx, '#4060ff', 0, -16, 16, 32, 1, x, y);
        } else if (idx_d === ((INDEX_ROAD_BRIDGE_D + 1) | INDEX_TILE3) || idx_d === ((INDEX_RAIL_BRIDGE_D + 1) | INDEX_TILE3)) {
            draw_square_q(ctx, '#4060ff', -16, 0, 32, 16, 1, x, y);
        }

        if (idx_d !== INDEX_NONE) {
            switch (idx_d & MASK_TILESIZE) {
            case 0:
                mip1.draw_eqscale(ctx, idx_d, x, y);
                break;
            case INDEX_TILE3:
                mip3.draw_eqscale(ctx, (idx_d & MASK_INDEX), x, y);
                break;
            case INDEX_TILE4:
                mip4.draw_eqscale(ctx, (idx_d & MASK_INDEX), x, y);
                break;
            case INDEX_TILE6:
                mip6.draw_eqscale(ctx, (idx_d & MASK_INDEX), x, y);
                break;
            }
        }
        switch (idx_d) {
        case INDEX_ROAD_BRIDGE_D | INDEX_TILE3:
            mip1.draw_eqscale(ctx, INDEX_ROAD_BRIDGE, x + 32, y - 16);
            mip1.draw_eqscale(ctx, INDEX_ROAD_BRIDGE, x - 32, y + 16);
            break;
        case INDEX_RAIL_BRIDGE_D | INDEX_TILE3:
            mip1.draw_eqscale(ctx, INDEX_RAIL_BRIDGE, x + 32, y - 16);
            mip1.draw_eqscale(ctx, INDEX_RAIL_BRIDGE, x - 32, y + 16);
            break;
        case (INDEX_ROAD_BRIDGE_D + 1) | INDEX_TILE3:
            mip1.draw_eqscale(ctx, INDEX_ROAD_BRIDGE + 1, x - 32, y - 16);
            mip1.draw_eqscale(ctx, INDEX_ROAD_BRIDGE + 1, x + 32, y + 16);
            break;
        case (INDEX_RAIL_BRIDGE_D + 1) | INDEX_TILE3:
            mip1.draw_eqscale(ctx, INDEX_RAIL_BRIDGE + 1, x - 32, y - 16);
            mip1.draw_eqscale(ctx, INDEX_RAIL_BRIDGE + 1, x + 32, y + 16);
            break;
        }
        if (idx_d === (INDEX_R_ZONE_D | INDEX_TILE3) && idx_u === INDEX_R_ZONE_MARK) {
            // draw small house
            for (let yy = -1; yy <= 1; yy++) {
                let pos2 = pos + yy * map_size;
                for (let xx = -1; xx <= 1; xx++) {
                    idx_u = u_tiles[pos2 + xx];
                    mip1.draw_eqscale(ctx, idx_u, x + (xx - yy) * 32, y + (xx + yy) * 16);
                }
            }
        } else if (idx_u !== INDEX_NONE) {
            switch (idx_u & MASK_TILESIZE) {
            case 0:
                mip1.draw_eqscale(ctx, idx_u, x, y);
                break;
            case INDEX_TILE3:
                mip3.draw_eqscale(ctx, (idx_u & MASK_INDEX), x, y);
                break;
            case INDEX_TILE4:
                mip4.draw_eqscale(ctx, (idx_u & MASK_INDEX), x, y);
                break;
            case INDEX_TILE6:
                mip6.draw_eqscale(ctx, (idx_u & MASK_INDEX), x, y);
                break;
            }
        }
    };
    function draw_building_tile(ctx, name, x, y, scale) {
        let sq = scale * quality;

        switch (name) {
        case 'r_zone':
            draw_maptip_q(ctx, maptip.r_frame, x, y, sq);
            draw_maptip_q(ctx, resource.gettext('vec_r_mark'), x, y, sq);
            break;
        case 'c_zone':
            draw_maptip_q(ctx, maptip.c_frame, x, y, sq);
            draw_maptip_q(ctx, resource.gettext('vec_c_mark'), x, y, sq);
            break;
        case 'i_zone':
            draw_maptip_q(ctx, maptip.i_frame, x, y, sq);
            draw_maptip_q(ctx, resource.gettext('vec_i_mark'), x, y, sq);
            break;
        case 'hospital':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.hospital, x, y, sq);
            break;
        case 'school':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.school, x, y, sq);
            break;
        case 'station':
            draw_maptip_q(ctx, maptip.station_rail_ns, x, y, sq);
            draw_maptip_q(ctx, maptip.station_ns, x, y, sq);
            break;
        case 'police_dept':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.police_dept, x, y, sq);
            break;
        case 'fire_dept':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.fire_dept, x, y, sq);
            break;
        case 'police_hq':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.police_hq, x, y, sq);
            break;
        case 'fire_hq':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.fire_hq, x, y, sq);
            break;
        case 'your_house':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.your_house1, x, y, sq);
            break;
        case 'terminal_station':
            draw_maptip_q(ctx, maptip.station_rail_ns, x, y, sq);
            draw_maptip_q(ctx, maptip.tstation_ns, x, y, sq);
            break;
        case 'amusement_park':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.amusement_park, x, y, sq);
            break;
        case 'casino':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.casino, x, y, sq);
            break;
        case 'bank':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.bank, x, y, sq);
            break;
        case 'monster_statue':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.monster_statue, x, y, sq);
            break;
        case 'zoo':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.zoo, x, y, sq);
            break;
        case 'library':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.library, x, y, sq);
            break;
        case 'windmill':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.windmill_0, x, y, sq);
            break;
        case 'garden':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.garden, x, y, sq);
            break;
        case 'tower':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.tower, x, y, sq);
            break;
        case 'fountain':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.fountain_0, x, y, sq);
            break;
        case 'expo':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.expo, x, y, sq);
            break;
        case 'monolith':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            draw_maptip_q(ctx, maptip.monolith, x, y, sq);
            break;
        case 'land_fill':
            draw_maptip_q(ctx, maptip.land3, x, y, sq);
            break;
        }
    }
    this.init_full_canvas = function() {
        document.getElementById('indicator-text').style.display = 'none';
        document.getElementById('indicator-menu').style.display = 'none';
        document.getElementById('indicator-build-icons').style.display = 'none';
        document.getElementById('minimap-view-wrapper').style.display = 'none';
        document.getElementById('indicator-demands-wrapper').style.display = 'none';
        document.getElementById('main-view-wrapper').style.gridRow = '1 / 4';
    };
    this.init_game_canvas = function() {
        document.getElementById('indicator-text').style.display = '';
        document.getElementById('indicator-menu').style.display = '';
        document.getElementById('indicator-build-icons').style.display = '';
        document.getElementById('minimap-view-wrapper').style.display = '';
        document.getElementById('indicator-demands-wrapper').style.display = '';
        document.getElementById('main-view-wrapper').style.gridRow = '';
    };
    function get_land_value_index(city, x, y, step) {
        let v = city.tile_land_value[(x >> 1) + (y >> 1) * city.map_size2];
        if (v < LAND_VALUE_LOW) {
            return 0;
        } else if (v < LAND_VALUE_MIDDLE) {
            return step;
        } else if (v < LAND_VALUE_HIGH) {
            return step * 2;
        } else {
            return step * 3;
        }
    }
    this.update_tile_rci = function(city) {
        for (let y = 0; y < city.map_size; y++) {
            const i = 1 + (y + 1) * city.map_size_edge;
            for (let x = 0; x < city.map_size; x++) {
                let pos = x + y * city.map_size;

                let name_u = INDEX_NONE;
                let t = city.tile_data[i + x];
                let t2 = city.tile_data[i + x - city.map_size_edge];
                let tile_sub;

                switch (t) {
                case M_R_ZONE:
                    if (city.tile_sub[i + x] > 0) {
                        name_u = INDEX_R_ZONE_1 + get_land_value_index(city, x, y, 1);
                    }
                    u_tiles[pos] = name_u;
                    break;
                case M_R_ZONE | F_CENTER:
                    tile_sub = city.tile_sub[i + x];
                    if (tile_sub >= 6) {
                        name_u = (INDEX_R_TOP + tile_sub - 6) | INDEX_TILE3;
                    } else if (tile_sub >= 2) {
                        name_u = (INDEX_R_ZONE + get_land_value_index(city, x, y, 4) + tile_sub - 2) | INDEX_TILE3;
                    } else {
                        name_u = INDEX_R_ZONE_MARK;
                    }
                    u_tiles[pos] = name_u;
                    break;
                case M_C_ZONE | F_CENTER:
                    tile_sub = city.tile_sub[i + x];
                    if (tile_sub >= 6) {
                        name_u = (INDEX_C_TOP + tile_sub - 6) | INDEX_TILE3;
                    } else if (tile_sub >= 1) {
                        name_u = (INDEX_C_ZONE + get_land_value_index(city, x, y, 5) + tile_sub - 1) | INDEX_TILE3;
                    } else {
                        name_u = INDEX_C_ZONE_MARK;
                    }
                    u_tiles[pos] = name_u;
                    break;
                case M_I_ZONE | F_CENTER:
                    if (city.tile_sub[i + x] >= 1) {
                        let v = city.tile_land_value[(x >> 1) + (y >> 1) * city.map_size2];
                        name_u = (INDEX_I_ZONE + (v < LAND_VALUE_LOW ? 0 : 4) + city.tile_sub[i + x] - 1) | INDEX_TILE3;
                    } else {
                        name_u = INDEX_I_ZONE_MARK;
                    }
                    u_tiles[pos] = name_u;
                    break;
                case M_HOSPITAL | F_CENTER:
                    d_tiles[pos] = INDEX_TILE3;
                    u_tiles[pos] = INDEX_HOSPITAL | INDEX_TILE3;
                    break;
                case M_SCHOOL | F_CENTER:
                    d_tiles[pos] = INDEX_TILE3;
                    u_tiles[pos] = INDEX_SCHOOL | INDEX_TILE3;
                    break;
                case M_PORT:
                    if (t2 === (M_PORT | F_CENTER)) {
                        if (city.tile_sub[i + x - city.map_size_edge] > 0) {
                            name_u = (INDEX_PORT + 2) | INDEX_TILE4;
                        } else {
                            name_u = INDEX_PORT | INDEX_TILE4;
                        }
                        if ((u_tiles[pos] & 1) !== 0) {
                            name_u++;
                        }
                        u_tiles[pos] = name_u;
                    }
                    break;
                case M_GOODS_ST:
                    if (t2 === (M_GOODS_ST | F_CENTER)) {
                        if (city.tile_sub[i + x - city.map_size_edge] > 0) {
                            name_u = (INDEX_GOODS_ST + 2) | INDEX_TILE4;
                            if ((d_tiles[pos] & 1) === 0) {
                                name_u++;
                            }
                        } else {
                            name_u = INDEX_NONE;
                        }
                        u_tiles[pos] = name_u;
                    }
                    break;
                }
            }
        }
    };
    this.remove_small_house = function(city, x, y) {
        let pos = x + y * city.map_size;
        u_tiles[pos] = INDEX_NONE;
    };
    this.update_tile_range = function(city, x1, x2, y1, y2) {
        if (x1 < 0) x1 = 0;
        if (x2 > map_size) x2 = map_size;
        if (y1 < 0) y1 = 0;
        if (y2 > map_size) y2 = map_size;

        for (let y = y1; y < y2; y++) {
            const i = 1 + (y + 1) * city.map_size_edge;
            for (let x = x1; x < x2; x++) {
                let pos = x + y * city.map_size;

                let name_u = INDEX_NONE;
                let name_d = INDEX_NONE;
                let name_c = 0;
                let name_a = 0;
                let t = city.tile_data[i + x];
                let t2 = city.tile_data[i + x - city.map_size_edge];

                switch (t) {
                case M_WATER:
                    name_d = city.get_coast_neighbor_flag(x, y);
                    break;
                case M_LAND:
                    name_d = INDEX_LAND;
                    if ((city.tile_fire[i + x] & 1) !== 0) {
                        name_u = INDEX_FIRE;
                    }
                    break;
                case M_RUBBLE:
                    name_d = INDEX_RUBBLE;
                    if ((city.tile_fire[i + x] & 1) !== 0) {
                        name_u = INDEX_FIRE;
                    }
                    break;
                case M_ROAD:
                    name_d = INDEX_ROAD + city.get_neighbor_flags(x, y, M_ROAD_WT);
                    break;
                case M_RAIL:
                    name_d = INDEX_RAIL + city.get_neighbor_flags(x, y, M_RAIL_WT);
                    break;
                case M_WIRE:
                    name_d = INDEX_LAND;
                    name_u = INDEX_WIRE + city.get_neighbor_flags(x, y, M_WIRE_WT);
                    break;
                case M_ROADRAIL:
                    if (city.neighbor_flag_ns(x, y, M_ROAD_WT)) {
                        name_d = INDEX_ROAD_RAIL;
                    } else if (city.neighbor_flag_we(x, y, M_ROAD_WT)) {
                        name_d = INDEX_ROAD_RAIL + 1;
                    } else if (city.neighbor_flag_ns(x, y, M_RAIL_WT)) {
                        name_d = INDEX_ROAD_RAIL + 1;
                    } else if (city.neighbor_flag_we(x, y, M_RAIL_WT)) {
                        name_d = INDEX_ROAD_RAIL;
                    } else {
                        name_d = INDEX_ROAD_RAIL;
                    }
                    name_u = INDEX_ROAD_RAIL_U;
                    break;
                case M_ROADWIRE:
                    if (city.neighbor_flag_ns(x, y, M_ROAD_WT)) {
                        name_d = INDEX_ROAD;
                        name_u = INDEX_WIRE2 + 1;
                    } else if (city.neighbor_flag_we(x, y, M_ROAD_WT)) {
                        name_d = INDEX_ROAD + 1;
                        name_u = INDEX_WIRE2;
                    } else if (city.neighbor_flag_ns(x, y, M_WIRE_WT)) {
                        name_d = INDEX_ROAD + 1;
                        name_u = INDEX_WIRE2;
                    } else if (city.neighbor_flag_we(x, y, M_WIRE_WT)) {
                        name_d = INDEX_ROAD;
                        name_u = INDEX_WIRE2 + 1;
                    } else {
                        name_d = INDEX_ROAD;
                        name_u = INDEX_WIRE2 + 1;
                    }
                    break;
                case M_RAILWIRE:
                    if (city.neighbor_flag_ns(x, y, M_RAIL_WT)) {
                        name_d = INDEX_RAIL;
                        name_u = INDEX_WIRE2 + 1;
                    } else if (city.neighbor_flag_we(x, y, M_RAIL_WT)) {
                        name_d = INDEX_RAIL + 1;
                        name_u = INDEX_WIRE2;
                    } else if (city.neighbor_flag_ns(x, y, M_WIRE_WT)) {
                        name_d = INDEX_RAIL + 1;
                        name_u = INDEX_WIRE2;
                    } else if (city.neighbor_flag_we(x, y, M_WIRE_WT)) {
                        name_d = INDEX_RAIL;
                        name_u = INDEX_WIRE2 + 1;
                    } else {
                        name_d = INDEX_RAIL;
                        name_u = INDEX_WIRE2 + 1;
                    }
                    break;
                case M_ROAD_WT:
                    if (city.neighbor_flag_we(x, y, M_ROAD_WT)) {
                        name_d = INDEX_ROAD_BRIDGE + 1;
                    } else {
                        name_d = INDEX_ROAD_BRIDGE + 0;
                    }
                    break;
                case M_ROAD_WT | F_CENTER:
                    if (city.neighbor_flag_we(x, y, M_ROAD_WT)) {
                        name_u = (INDEX_ROAD_BRIDGE_U + 1) | INDEX_TILE3;
                        name_d = (INDEX_ROAD_BRIDGE_D + 1) | INDEX_TILE3;
                    } else {
                        name_u = (INDEX_ROAD_BRIDGE_U + 0) | INDEX_TILE3;
                        name_d = (INDEX_ROAD_BRIDGE_D + 0) | INDEX_TILE3;
                    }
                    break;
                case M_RAIL_WT:
                    if (city.neighbor_flag_we(x, y, M_RAIL_WT)) {
                        name_d = INDEX_RAIL_BRIDGE + 1;
                    } else {
                        name_d = INDEX_RAIL_BRIDGE + 0;
                    }
                    break;
                case M_RAIL_WT | F_CENTER:
                    if (city.neighbor_flag_we(x, y, M_RAIL_WT)) {
                        name_u = (INDEX_RAIL_BRIDGE_U + 1) | INDEX_TILE3;
                        name_d = (INDEX_RAIL_BRIDGE_D + 1) | INDEX_TILE3;
                    } else {
                        name_u = (INDEX_RAIL_BRIDGE_U + 0) | INDEX_TILE3;
                        name_d = (INDEX_RAIL_BRIDGE_D + 0) | INDEX_TILE3;
                    }
                    break;
                case M_WIRE_WT:
                    if (city.neighbor_flag_we(x, y, M_WIRE_WT)) {
                        name_u = INDEX_WIRE2 + 1;
                    } else {
                        name_u = INDEX_WIRE2 + 0;
                    }
                    break;
                case M_WIRE_WT | F_CENTER:
                    if (city.neighbor_flag_we(x, y, M_WIRE_WT)) {
                        name_u = INDEX_WIRE + 1;
                    } else {
                        name_u = INDEX_WIRE + 0;
                    }
                    break;
                case M_TREE:
                    name_d = INDEX_LAND;
                    name_u = INDEX_TREE;
                    break;
                case M_R_ZONE:
                    if (city.tile_sub[i + x] > 0) {
                        name_u = u_tiles[pos];
                    }
                    break;
                case M_R_ZONE | F_CENTER:
                    name_d = INDEX_R_ZONE_D | INDEX_TILE3;
                    if (city.tile_sub[i + x] >= 2) {
                        name_u = u_tiles[pos];
                    } else if (u_tiles[pos] < INDEX_R_ZONE || u_tiles[pos] >= INDEX_R_ZONE + 16) {
                        name_u = INDEX_R_ZONE_MARK;
                    }
                    break;
                case M_C_ZONE | F_CENTER:
                    name_d = INDEX_C_ZONE_D | INDEX_TILE3;
                    if (city.tile_sub[i + x] >= 1) {
                        name_u = u_tiles[pos];
                    } else if (u_tiles[pos] < INDEX_C_ZONE || u_tiles[pos] >= INDEX_C_ZONE + 20) {
                        name_u = INDEX_C_ZONE_MARK;
                    }
                    break;
                case M_I_ZONE | F_CENTER:
                    name_d = INDEX_I_ZONE_D | INDEX_TILE3;
                    if (city.tile_sub[i + x] >= 1) {
                        name_u = u_tiles[pos];
                    } else if (u_tiles[pos] < INDEX_I_ZONE || u_tiles[pos] >= INDEX_I_ZONE + 8) {
                        name_u = INDEX_I_ZONE_MARK;
                    }
                    break;
                case M_HOSPITAL | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_HOSPITAL | INDEX_TILE3;
                    break;
                case M_SCHOOL | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_SCHOOL | INDEX_TILE3;
                    break;
                case M_POLICE_D | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_POLICE_DEPT | INDEX_TILE3;
                    break;
                case M_FIRE_D | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_FIRE_DEPT | INDEX_TILE3;
                    break;
                case M_STATION | F_CENTER:
                    if (city.neighbor_flag3_we(x, y, M_RAIL_WT)) {
                        name_d = (INDEX_STATION_RAIL + 1) | INDEX_TILE3;
                        name_u = (INDEX_STATION + 1) | INDEX_TILE3;
                    } else {
                        name_d = INDEX_STATION_RAIL | INDEX_TILE3;
                        name_u = INDEX_STATION | INDEX_TILE3;
                    }
                    break;
                case M_GOODS_ST:
                    if (t2 === (M_GOODS_ST | F_CENTER)) {
                        if (city.tile_sub[i + x - city.map_size_edge] > 0) {
                            name_u = (INDEX_GOODS_ST + 2) | INDEX_TILE4;
                        }
                        if (city.neighbor_flag4_we(x, y - 1, M_RAIL_WT)) {
                            name_d = (INDEX_GOODS_ST + 1) | INDEX_TILE4;
                            if (name_u !== INDEX_NONE) {
                                name_u++;
                            }
                        } else {
                            name_d = INDEX_GOODS_ST | INDEX_TILE4;
                        }
                    }
                    break;
                case M_STADIUM1:
                    if (t2 === (M_STADIUM1 | F_CENTER)) {
                        name_d = INDEX_PAVED | INDEX_TILE4;
                        name_u = (INDEX_STADIUM + 0) | INDEX_TILE4;
                    }
                    break;
                case M_STADIUM2:
                    if (t2 === (M_STADIUM2 | F_CENTER)) {
                        name_d = INDEX_PAVED | INDEX_TILE4;
                        name_u = (INDEX_STADIUM + 1) | INDEX_TILE4;
                    }
                    break;
                case M_PORT:
                    if (t2 === (M_PORT | F_CENTER)) {
                        if (city.neighbor_flag4_we(x, y - 1, M_LAND)) {
                            name_d = INDEX_PORT_BASE | INDEX_TILE4;
                            name_u = INDEX_PORT | INDEX_TILE4;
                        } else {
                            name_d = (INDEX_PORT_BASE + 1) | INDEX_TILE4;
                            name_u = (INDEX_PORT + 1) | INDEX_TILE4;
                        }
                        if (city.tile_sub[i + x - city.map_size_edge] > 0) {
                            name_u += 2;
                        }
                    }
                    break;
                case M_COAL_PWR:
                    if (t2 === (M_COAL_PWR | F_CENTER)) {
                        name_d = INDEX_PAVED | INDEX_TILE4;
                        name_u = INDEX_COAL_PWR | INDEX_TILE4;
                    }
                    break;
                case M_GAS_PWR:
                    if (t2 === (M_GAS_PWR | F_CENTER)) {
                        name_d = INDEX_PAVED | INDEX_TILE4;
                        name_u = INDEX_GAS_PWR | INDEX_TILE4;
                    }
                    break;
                case M_NUKE_PWR:
                    if (t2 === (M_NUKE_PWR | F_CENTER)) {
                        name_d = INDEX_PAVED | INDEX_TILE4;
                        name_u = INDEX_NUKE_PWR | INDEX_TILE4;
                    }
                    break;
                case M_AIRPORT:
                    if (t2 === (M_AIRPORT | F_CENTER)) {
                        name_d = INDEX_AIRPORT | INDEX_TILE6;
                    }
                    break;
                case M_YR_HOUSE | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_YOUR_HOUSE | INDEX_TILE3;
                    switch (city.next_population) {
                    case 2000:
                    case 10000:
                        break;
                    case 50000:
                        name_u += 1;
                        break;
                    case 100000:
                        name_u += 2;
                        break;
                    case 500000:
                        name_u += 3;
                        break;
                    default:
                        name_u += 4;
                        break;
                    }
                    break;
                case M_TERM_STN | F_CENTER:
                    if (city.neighbor_flag3_we(x, y, M_RAIL_WT)) {
                        name_d = (INDEX_STATION_RAIL + 1) | INDEX_TILE3;
                        name_u = (INDEX_TML_STATION + 1) | INDEX_TILE3;
                    } else {
                        name_d = INDEX_STATION_RAIL | INDEX_TILE3;
                        name_u = INDEX_TML_STATION | INDEX_TILE3;
                    }
                    break;
                case M_POLICE_HQ | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_POLICE_HQ | INDEX_TILE3;
                    break;
                case M_FIRE_HQ | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_FIRE_HQ | INDEX_TILE3;
                    break;
                case M_AMUSEMENT | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_AMUSEMENT | INDEX_TILE3;
                    break;
                case M_CASINO | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_CASINO | INDEX_TILE3;
                    break;
                case M_BANK | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_BANK | INDEX_TILE3;
                    break;
                case M_M_STATUE | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_M_STATUE | INDEX_TILE3;
                    break;
                case M_ZOO | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_ZOO | INDEX_TILE3;
                    break;
                case M_LIBRARY | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_LIBRARY | INDEX_TILE3;
                    break;
                case M_WINDMILL | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_WINDMILL | INDEX_TILE3;
                    break;
                case M_TOWER | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_TOWER | INDEX_TILE3;
                    break;
                case M_GARDEN | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_GARDEN | INDEX_TILE3;
                    break;
                case M_FOUNTAIN | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_FOUNTAIN | INDEX_TILE3;
                    break;
                case M_EXPO | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_EXPO | INDEX_TILE3;
                    break;
                case M_MONOLITH | F_CENTER:
                    name_d = INDEX_TILE3;
                    name_u = INDEX_MONOLITH | INDEX_TILE3;
                    break;
                }
                if ((t & F_CENTER) !== 0) {
                    if ((city.tile_fire[i + x] & MF_RADIO) !== 0) {
                        name_a = INDEX_RADIO;
                    } else if (city.tile_power[i + x] === 1) {
                        name_a = INDEX_BLACKOUT;
                    }
                } else if ((t & 0x3F00) === 0) {
                    if ((city.tile_fire[i + x] & MF_RADIO) !== 0) {
                        name_a = INDEX_RADIO;
                    }
                }
                d_tiles[pos] = name_d;
                c_tiles[pos] = name_c;
                u_tiles[pos] = name_u;
                a_tiles[pos] = name_a;
            }
        }
    };
    this.update_power_grid = function(city) {
        for (let y = 0; y < map_size; y++) {
            const i = 1 + (y + 1) * city.map_size_edge;
            for (let x = 0; x < map_size; x++) {
                let name_a = 0;
                let pos = x + y * city.map_size;
                let t = city.tile_data[i + x];
                let f = city.tile_fire[i + x];
                if (t === M_RUBBLE) {
                    d_tiles[pos] = INDEX_RUBBLE;
                }
                if ((f & MF_FIRE) !== 0) {
                    u_tiles[pos] = INDEX_FIRE;
                } else if (u_tiles[pos] === INDEX_FIRE) {
                    u_tiles[pos] = INDEX_NONE;
                } else if (t === M_RUBBLE) {
                    u_tiles[pos] = INDEX_NONE;
                } else if (t === (M_YR_HOUSE | F_CENTER)) {
                    let offset;
                    switch (city.next_population) {
                    case 2000:
                    case 10000:
                        offset = 0;
                        break;
                    case 50000:
                        offset = 1;
                        break;
                    case 100000:
                        offset = 2;
                        break;
                    case 500000:
                        offset = 3;
                        break;
                    default:
                        offset = 4;
                        break;
                    }
                    u_tiles[pos] = (INDEX_YOUR_HOUSE + offset) | INDEX_TILE3;
                }
                if ((t & F_CENTER) !== 0) {
                    if ((city.tile_fire[i + x] & MF_RADIO) !== 0) {
                        name_a = INDEX_RADIO;
                    } else if (city.tile_power[i + x] === 1) {
                        name_a = INDEX_BLACKOUT;
                    }
                } else if ((t & 0x3F00) === 0) {
                    if ((city.tile_fire[i + x] & MF_RADIO) !== 0) {
                        name_a = INDEX_RADIO;
                    }
                }
                a_tiles[pos] = name_a;
            }
        }
    };
    this.update_road_traffic = function(city) {
        for (let y = 0; y < map_size; y++) {
            const i = 1 + (y + 1) * city.map_size_edge;
            for (let x = 0; x < map_size; x++) {
                let tpos = x + y * city.map_size;
                let name_c = 0;
                let tv = city.tile_road[i + x];
                if (tv >= 8 && tv < 255) {
                    let t = city.tile_data[i + x];
                    let c = 0;
                    if (t === M_ROAD || t === M_ROADWIRE) {
                        switch (d_tiles[tpos] - INDEX_ROAD) {
                        default:
                            c = INDEX_JAM_1010;
                            break;
                        case 1:
                        case 6:
                        case 8:
                            c = INDEX_JAM_0101;
                            break;
                        case 2:
                            c = INDEX_JAM_1100;
                            break;
                        case 3:
                            c = INDEX_JAM_0110;
                            break;
                        case 4:
                            c = INDEX_JAM_0011;
                            break;
                        case 5:
                            c = INDEX_JAM_1001;
                            break;
                        }
                    } else {
                        switch (d_tiles[tpos]) {
                        case INDEX_ROAD_RAIL + 0:
                        case INDEX_ROAD_BRIDGE + 0:
                        case (INDEX_ROAD_BRIDGE_D + 0) | INDEX_TILE3:
                            c = INDEX_JAM_1010;
                            break;
                        case INDEX_ROAD_RAIL + 1:
                        case INDEX_ROAD_BRIDGE + 1:
                        case (INDEX_ROAD_BRIDGE_D + 1) | INDEX_TILE3:
                            c = INDEX_JAM_0101;
                            break;
                        }
                    }
                    if (c > 0) {
                        if (tv > 24) {
                            c += 4;
                        }
                        name_c = c;
                    }
                }
                c_tiles[tpos] = name_c;
            }
        }
    };
    this.update_all = function(city) {
        this.update_tile_range(city, 0, city.map_size, 0, city.map_size);
        this.update_tile_rci(city);
        this.update_road_traffic(city);
    };
    this.set_tiles = function(city) {
        map_size = city.map_size;
        map_size_edge = city.map_size_edge;
        tile_fire = city.tile_fire;
        scale = 0.25;

        u_tiles = new Uint16Array(map_size * map_size);
        c_tiles = new Uint8Array(map_size * map_size);
        d_tiles = new Uint16Array(map_size * map_size);
        a_tiles = new Uint8Array(map_size * map_size);

        let client_width = window.innerWidth;
        let client_height = window.innerHeight - 136;

        this.update_tile_range(city, 0, map_size, 0, map_size);
        current_scroll_x = Math.floor(client_width / 2);
        current_scroll_y = Math.floor(client_height / 2 - map_size * 16 * scale);

        mip1.update_scale();
        mip3.update_scale();
        mip4.update_scale();
        mip6.update_scale();
        mipt.update_scale();
    };

    function draw_cursor(self, sq) {
        if (self.cursor_drag_mode !== 0) {
            let x1 = self.cursor_x;
            let x2 = self.cursor_x_begin;
            let y1 = self.cursor_y;
            let y2 = self.cursor_y_begin;
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
            draw_square_q(main_view_ctx, 'rgba(128,128,255,0.5)', x1 * 16 - 8, y1 * 16 - 8, x2 * 16 + 8, y2 * 16 + 8, scale, current_scroll_x, current_scroll_y);
        } else {
            let x = self.cursor_x * 16 - 8;
            let y = self.cursor_y * 16 - 8;
            let c1 = Math.floor((cursor_size - 1) / 2) * 16;
            let c2 = Math.floor(cursor_size / 2 + 1) * 16;
            draw_square_q(main_view_ctx, 'rgba(128,128,255,0.5)', x - c1, y - c1, x + c2, y + c2, scale, current_scroll_x, current_scroll_y);
        }
    }
    this.draw_main = function(speed) {
        if (!enable_redraw) {
            return;
        }
        if (minimap_update_required) {
            this.update_minimap();
        }
        switch (speed) {
        case 'pause':
            ticks = 0;
            break;
        case 'normal':
        case 'emergency':
            ticks++;
            break;
        case 'fast':
            ticks += 5;
            break;
        }
        if (ticks >= 20) {
            ticks = 0;
        }

        let sq = scale * quality;

        // canvas.resize
        if (main_view_wrapper.clientWidth !== this.client_width || main_view_wrapper.clientHeight !== this.client_height) {
            this.client_width = window.innerWidth;
            this.client_height = window.innerHeight - 136;
            set_canvas_size(main_view, this.client_width, this.client_height - 4);
            main_view_ctx = main_view.getContext('2d');
        }
        main_view_ctx.clearRect(0, 0, main_view.width, main_view.height);
        // sea
        draw_square_q(main_view_ctx, '#4060ff', 0, 0, map_size * 16, map_size * 16, scale, current_scroll_x, current_scroll_y);

        if (d_tiles == null || u_tiles == null) {
            return;
        }
        let tile_x = 32 * sq;
        let tile_y = 16 * sq;
        let blink = (ticks % 10) < 5;
        let animation = Math.floor(ticks / 5);

        if (this.monster.dir >= 0 && this.monster.water) {
            draw_monster(this.monster, sq);
        }
        draw_object(this.container_ship, INDEX_SHIP, sq);

        for (let i = 0; i < (map_size - 1); i++) {
            for (let j = 0; j <= i; j++) {
                let x = j;
                let y = i - j;
                let cx = (x - y) * tile_x + current_scroll_x;
                let cy = (x + y) * tile_y + current_scroll_y;
                let t = d_tiles[x + y * map_size];
                if (t !== INDEX_NONE) {
                    this.draw_maptip(main_view_ctx, t, cx, cy);
                }
                let c = c_tiles[x + y * map_size];
                if (c > 0) {
                    this.draw_maptip(main_view_ctx, c + animation, cx, cy);
                }
            }
        }
        for (let i = 0; i < map_size; i++) {
            for (let j = 0; j < (map_size - i); j++) {
                let x = i + j;
                let y = map_size - j - 1;
                let cx = (x - y) * tile_x + current_scroll_x;
                let cy = (x + y) * tile_y + current_scroll_y;
                let t = d_tiles[x + y * map_size];
                if (t !== INDEX_NONE) {
                    this.draw_maptip(main_view_ctx, t, cx, cy);
                }
                let c = c_tiles[x + y * map_size];
                if (c > 0) {
                    this.draw_maptip(main_view_ctx, c + animation, cx, cy);
                }
            }
        }
        if (tile_fire != null) {
            for (let y = 0; y < map_size; y++) {
                let pos = 1 + (y + 1) * map_size_edge;
                for (let x = 0; x < map_size; x++) {
                    if ((tile_fire[pos + x] & MF_FLOOD) !== 0) {
                        let cx = (x - y) * tile_x + current_scroll_x;
                        let cy = (x + y) * tile_y + current_scroll_y;
                        this.draw_maptip(main_view_ctx, INDEX_FLOOD, cx, cy);
                    }
                }
            }
        }

        draw_train(this);

        if (this.tornado.dir >= 0) {
            let x = (this.tornado.x - this.tornado.y) * 2;
            let y = (this.tornado.x + this.tornado.y);
            let spin = this.tornado.spin;
            main_view_ctx.globalAlpha = 0.75;
            for (let z = 1; z < 3; z++) {
                mipt.draw(main_view_ctx, INDEX_TORNADO_CORE, x * sq + current_scroll_x + this.tornado.scatter[z], (y - z * 16) * sq + current_scroll_y);
                if (this.tornado.dust) {
                    mipt.draw(main_view_ctx, INDEX_TORNADO + spin, x * sq + current_scroll_x + this.tornado.scatter[z], (y - z * 16) * sq + current_scroll_y);
                    spin++;
                    if (spin >= 4) spin = 0;
                }
            }
            main_view_ctx.globalAlpha = 1;
        }
        if (!this.opaque_buildings) {
            main_view_ctx.globalAlpha = 0.5;
        }
        for (let i = 0; i < (map_size - 1); i++) {
            for (let j = 0; j <= i; j++) {
                let x = j;
                let y = i - j;
                let cx = (x - y) * tile_x + current_scroll_x;
                let cy = (x + y) * tile_y + current_scroll_y;
                let t = u_tiles[x + y * map_size];
                if (t !== INDEX_NONE) {
                    switch (t) {
                    case INDEX_FIRE:
                        t += (animation + i + j * 2) & 3;
                        break;
                    case INDEX_WINDMILL | INDEX_TILE3:
                        t += animation;
                        break;
                    case INDEX_FOUNTAIN | INDEX_TILE3:
                        t += ticks & 1;
                        break;
                    }
                    this.draw_maptip(main_view_ctx, t, cx, cy);
                }
            }
        }
        for (let i = 0; i < map_size; i++) {
            for (let j = 0; j < (map_size - i); j++) {
                let x = i + j;
                let y = map_size - j - 1;
                let cx = (x - y) * tile_x + current_scroll_x;
                let cy = (x + y) * tile_y + current_scroll_y;
                let t = u_tiles[x + y * map_size];
                if (t !== INDEX_NONE) {
                    switch (t) {
                    case INDEX_FIRE:
                        t += (animation + i + j * 2) & 3;
                        break;
                    case INDEX_WINDMILL | INDEX_TILE3:
                        t += animation;
                        break;
                    case INDEX_FOUNTAIN | INDEX_TILE3:
                        t += ticks & 1;
                        break;
                    }
                    this.draw_maptip(main_view_ctx, t, cx, cy);
                }
            }
        }
        if (this.color_scheme) {
            for (let y = 0; y < map_size; y++) {
                let pos = y * map_size;
                for (let x = 0; x < map_size; x++) {
                    let t = u_tiles[pos + x];
                    let idx = -1;
                    if (t >= (INDEX_R_ZONE | INDEX_TILE3) && t < ((INDEX_R_TOP + 4) | INDEX_TILE3)) {
                        idx = INDEX_R_ZONE_MARK;
                    } else if (t >= (INDEX_C_ZONE | INDEX_TILE3) && t < ((INDEX_C_TOP + 4) | INDEX_TILE3)) {
                        idx = INDEX_C_ZONE_MARK;
                    } else if (t >= (INDEX_I_ZONE | INDEX_TILE3) && t < ((INDEX_I_ZONE + 8) | INDEX_TILE3)) {
                        idx = INDEX_I_ZONE_MARK;
                    }
                    if (idx >= 0) {
                        let cx = (x - y) * tile_x + current_scroll_x;
                        let cy = (x + y) * tile_y + current_scroll_y;
                        this.draw_maptip(main_view_ctx, idx, cx, cy);
                    }
                }
            }
        }
        if (this.monster.dir >= 0 && !this.monster.water) {
            draw_monster(this.monster, sq);
        }

        if (this.tornado.dir >= 0) {
            let x = (this.tornado.x - this.tornado.y) * 2;
            let y = (this.tornado.x + this.tornado.y);
            let spin = this.tornado.spin;
            main_view_ctx.globalAlpha = 0.75;
            for (let z = 3; z < 5; z++) {
                mipt.draw(main_view_ctx, INDEX_TORNADO_CORE, x * sq + current_scroll_x + this.tornado.scatter[z], (y - z * 16) * sq + current_scroll_y);
                if (this.tornado.dust) {
                    mipt.draw(main_view_ctx, INDEX_TORNADO + spin, x * sq + current_scroll_x + this.tornado.scatter[z], (y - z * 16) * sq + current_scroll_y);
                    spin++;
                    if (spin >= 4) spin = 0;
                }
            }
            main_view_ctx.globalAlpha = 0.25;
            for (let z = 4; z < 6; z++) {
                mipt.draw(main_view_ctx, INDEX_TORNADO_CORE, x * sq + current_scroll_x + Math.random() * 4 - 2, (y - z * 16) * sq + current_scroll_y);
            }
            main_view_ctx.globalAlpha = 1;
        }
        if (!this.opaque_buildings) {
            main_view_ctx.globalAlpha = 1;
        }
        if (blink) {
            for (let i = 0; i < (map_size - 1); i++) {
                for (let j = 0; j <= i; j++) {
                    let x = j;
                    let y = i - j;
                    let cx = (x - y) * tile_x + current_scroll_x;
                    let cy = (x + y) * tile_y + current_scroll_y;
                    let a = a_tiles[x + y * map_size];
                    if (a !== 0) {
                        this.draw_maptip(main_view_ctx, a, cx, cy);
                    }
                }
            }
            for (let i = 0; i < map_size; i++) {
                for (let j = 0; j < (map_size - i); j++) {
                    let x = i + j;
                    let y = map_size - j - 1;
                    let cx = (x - y) * tile_x + current_scroll_x;
                    let cy = (x + y) * tile_y + current_scroll_y;
                    let a = a_tiles[x + y * map_size];
                    if (a !== 0) {
                        this.draw_maptip(main_view_ctx, a, cx, cy);
                    }
                }
            }
        }
        draw_object(this.helicopter, INDEX_HELI, sq);
        draw_object(this.airplane, INDEX_PLANE, sq);
        draw_ufo(this.ufo_disaster, sq);

        if (this.cursor_x >= 0) {
            draw_cursor(this, sq);
        }
    };
    function draw_train(self) {
        if (self.train_ticks >= 0) {
            train_sort.sort((a, b) => (a.x + a.y) - (b.x + b.y));
            let sq = scale * quality;
            for (let i = 0; i < train_sort.length; i++) {
                let t = train_sort[i];
                if (t.d1 >= 0 && t.d2 >= 0) {
                    let x = (t.x - t.y) * 32;
                    let y = (t.x + t.y) * 16;
                    let idx = TRAIN_DIR[(t.d1 << 2) | t.d2];
                    mip1.draw(main_view_ctx, INDEX_TRAIN + idx, x * sq + current_scroll_x, y * sq + current_scroll_y);
                }
            }
        }
    }
    function draw_object(obj, index, sq) {
        if (obj.dir >= 0) {
            let x = (obj.x - obj.y) * 2;
            let y = (obj.x + obj.y) - obj.z * 2;
            mipt.draw(main_view_ctx, index + obj.dir, x * sq + current_scroll_x, y * sq + current_scroll_y);
        }
    }
    function draw_monster(m, sq) {
        let idx;
        let x = (m.x - m.y) * 2;
        let y = m.x + m.y;

        if (m.water) {
            idx = INDEX_MONSTER_WATER;
        } else {
            if (m.fire) {
                idx = INDEX_MONSTER_FIRE;
            } else if (m.walk === 1) {
                idx = INDEX_MONSTER + 4;
            } else if (m.walk === 3) {
                idx = INDEX_MONSTER + 8;
            } else {
                idx = INDEX_MONSTER;
            }
            idx += m.dir >> 1;
            y -= 16;
        }
        mipt.draw(main_view_ctx, idx, x * sq + current_scroll_x, y * sq + current_scroll_y);
    }
    function draw_ufo(u, sq) {
        if (u.dir >= 0) {
            let x = (u.x - u.y) * 2;
            let y = u.x + u.y;
            let idx = INDEX_UFO + u.ticks % 2;
            if (u.ticks >= 10 && u.ticks < 30) {
                mipt.draw(main_view_ctx, INDEX_UFO_RAY, x * sq + current_scroll_x, (y - 16) * sq + current_scroll_y);
            }
            mipt.draw(main_view_ctx, idx, x * sq + current_scroll_x, (y - 64) * sq + current_scroll_y);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////

    this.begin_scroll = function(x, y) {
        down_point_x = x;
        down_point_y = y;
    };
    this.scroll = function(x, y) {
        current_scroll_x += (x - down_point_x) * quality;
        current_scroll_y += (y - down_point_y) * quality;
        down_point_x = x;
        down_point_y = y;
        minimap_update_required = true;
    };
    this.move_relative = function(x, y) {
        let sq = scale * quality;
        current_scroll_x += x * sq;
        current_scroll_y += y * sq;
        minimap_update_required = true;
    };
    this.limit_scroll = function() {
        let width = 32 * map_size * scale * quality;
        let center_x = this.client_width * quality / 2;
        let center_y = this.client_height * quality / 2;
        if (current_scroll_x < center_x - width) {
            current_scroll_x = center_x - width;
        }
        if (current_scroll_x > center_x + width) {
            current_scroll_x = center_x + width;
        }
        let ylim = center_y - Math.abs(current_scroll_x - center_x) / 2;
        if (current_scroll_y > ylim) {
            current_scroll_y = ylim;
        }
        ylim = center_y - width + Math.abs(current_scroll_x - center_x) / 2;
        if (current_scroll_y < ylim) {
            current_scroll_y = ylim;
        }
    };
    this.move_position_at = function(x, y) {
        let sq = scale * quality;
        current_scroll_x = this.client_width / 2 - (x - y) * 32 * sq;
        current_scroll_y = this.client_height / 2 - (x + y) * 16 * sq;
    };
    this.update_minimap = function() {
        if (this.client_width > 0) {
            let factor = 1.875 / map_size / scale;
            let width = this.client_width * factor;
            let height = 2 * this.client_height * factor;

            minimap_view_area.setAttribute('x', 100 - current_scroll_x * factor);
            minimap_view_area.setAttribute('y', 10 - 2 * current_scroll_y * factor);
            minimap_view_area.setAttribute('width', width);
            minimap_view_area.setAttribute('height', height);

            minimap_update_required = false;
        }
    };
    this.zoom = function(x1, y1, d) {
        const x = x1 * quality;
        const y = y1 * quality;
        const prevX = (current_scroll_x - x) / scale;
        const prevY = (current_scroll_y - y) / scale;
        if (d < 0) {
            if (scale < 1) {
                scale *= 2;
            }
        } else if (d > 0) {
            if (scale > 0.25) {
                scale *= 0.5;
            }
        }
        current_scroll_x = (prevX * scale + x);
        current_scroll_y = (prevY * scale + y);
        mip1.update_scale();
        mip3.update_scale();
        mip4.update_scale();
        mip6.update_scale();
        mipt.update_scale();
    };
    this.update_cursor_pos = function(x, y) {
        const px = (x - current_scroll_x / quality) / scale;
        const py = (y - current_scroll_y / quality) / scale;
        this.cursor_x = (px + py * 2 + 32) / 64;
        this.cursor_y = (py * 2 - px + 32) / 64;
        if (this.cursor_x < 0 || this.cursor_x >= map_size || this.cursor_y < 0 || this.cursor_y >= map_size) {
            this.cursor_x = -1;
            this.cursor_y = -1;
        } else {
            if (cursor_size % 2 == 0) {
                this.cursor_x -= 0.5;
                this.cursor_y -= 0.5;
            }
            this.cursor_x = Math.floor(this.cursor_x);
            this.cursor_y = Math.floor(this.cursor_y);
            if (this.cursor_drag_mode === 2) {
                if (Math.abs(this.cursor_x - this.cursor_x_begin) >= Math.abs(this.cursor_y - this.cursor_y_begin)) {
                    this.cursor_y = this.cursor_y_begin;
                } else {
                    this.cursor_x = this.cursor_x_begin;
                }
            }
        }
    };
    this.set_begin_cursor = function(mode) {
        this.cursor_x_begin = this.cursor_x;
        this.cursor_y_begin = this.cursor_y;
        this.cursor_drag_mode = mode;
    };
    this.set_end_cursor = function() {
        this.cursor_x_begin = -1;
        this.cursor_y_begin = -1;
        this.cursor_drag_mode = 0;
    };
    this.clear_view = function() {
        main_view_ctx.clearRect(0, 0, main_view.width, main_view.height);
    };

    this.update_vehicle = function(o) {
        if (o.d > 0) {
            o.x += o.dx;
            o.y += o.dy;
            o.z += o.dz;
            o.d--;
        }
    };
    this.update_vehicle_fast = function(o) {
        if (o.d >= 8) {
            o.x += o.dx * 8;
            o.y += o.dy * 8;
            o.z += o.dz * 8;
            o.d -= 8;
        } else if (o.d > 0) {
            o.x += o.dx * o.d;
            o.y += o.dy * o.d;
            o.z += o.dz * o.d;
            o.d = 0;
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////

    this.draw_build_icons = function(city, build_icon_info, left) {
        const tile_size = QTILE_SIZE * quality;
        const icon_w = ICON_W * quality;
        const icon_h = ICON_H * quality;

        build_icons_ctx.clearRect(left * icon_w, 0, build_icons.width - left * icon_w, build_icons.height);

        let ix = left;
        let iy = 0;
        let quality_4 = quality / 4;
        for (let i = 0; i < build_icon_info.length; i++) {
            let x = icon_w * ix + tile_size * 0.5;
            let y = icon_h * (iy + 1) - tile_size * 0.25;
            let name = build_icon_info[i].name;
            switch (name) {
            case 'inspect':
                draw_maptip_q(build_icons_ctx, maptip.query, x - tile_size * 0.125, y - tile_size * 0.1875, quality);
                break;
            case 'bulldoze':
                draw_maptip_q(build_icons_ctx, maptip.land1, x, y, quality);
                draw_maptip_q(build_icons_ctx, maptip.bulldoze, x, y - tile_size * 0.0625, quality);
                break;
            case 'road':
                draw_maptip_q(build_icons_ctx, maptip.road_1010, x, y, quality);
                break;
            case 'railroad':
                draw_maptip_q(build_icons_ctx, maptip.rail_1010, x, y, quality);
                break;
            case 'wire':
                draw_maptip_q(build_icons_ctx, maptip.land1, x, y, quality);
                draw_maptip_q(build_icons_ctx, maptip.wire_1010, x, y, quality);
                break;
            case 'tree':
                draw_maptip_q(build_icons_ctx, maptip.land1, x, y, quality);
                draw_maptip_q(build_icons_ctx, maptip.tree, x, y, quality);
                break;
            case 'stadium':
            case 'stadium1':
                draw_maptip_q(build_icons_ctx, maptip.paved4, x, y, quality_4);
                draw_maptip_q(build_icons_ctx, maptip.stadium1, x, y, quality_4);
                break;
            case 'stadium2':
                draw_maptip_q(build_icons_ctx, maptip.paved4, x, y, quality_4);
                draw_maptip_q(build_icons_ctx, maptip.stadium2, x, y, quality_4);
                break;
            case 'goods_st':
                draw_maptip_q(build_icons_ctx, maptip.goods_st_ns, x, y, quality_4);
                break;
            case 'sea_port':
                draw_maptip_q(build_icons_ctx, maptip.port_base_ns, x, y, quality_4);
                draw_maptip_q(build_icons_ctx, maptip.port_crane_ns, x, y, quality_4);
                break;
            case 'airport':
                draw_maptip_q(build_icons_ctx, maptip.airport, x, y, quality / 6);
                break;
            case 'coal_power_plant':
                draw_maptip_q(build_icons_ctx, maptip.paved4, x, y, quality_4);
                draw_maptip_q(build_icons_ctx, maptip.coal_power, x, y, quality_4);
                break;
            case 'gas_power_plant':
                draw_maptip_q(build_icons_ctx, maptip.paved4, x, y, quality_4);
                draw_maptip_q(build_icons_ctx, maptip.gas_power, x, y, quality_4);
                break;
            case 'nuke_power_plant':
                draw_maptip_q(build_icons_ctx, maptip.paved4, x, y, quality_4);
                draw_maptip_q(build_icons_ctx, maptip.nuke_power, x, y, quality_4);
                break;
            default:
                draw_building_tile(build_icons_ctx, name, x, y, 1 / 3);
                break;
            }
            if (iy === 0) {
                iy = 1;
            } else {
                iy = 0;
                ix++;
            }
        }
    };
    this.draw_terrain_icons = function() {
        build_icons_ctx.clearRect(0, 0, build_icons.width, build_icons.height);
        const tile_size = QTILE_SIZE * quality;
        const icon_w = ICON_W * quality;
        const icon_h = ICON_H * quality;

        draw_maptip_q(build_icons_ctx, maptip.sea, icon_w * 0 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.land1, icon_w * 1 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.land1, icon_w * 2 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.tree, icon_w * 2 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.land1, icon_w * 3 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.rubble, icon_w * 3 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.land1, icon_w * 4 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_fire(build_icons_ctx, icon_w * 4 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.road_1010, icon_w * 5 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.rail_1010, icon_w * 6 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.land1, icon_w * 7 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);
        draw_maptip_q(build_icons_ctx, maptip.wire_1010, icon_w * 7 + tile_size * 0.5, icon_h * 1 - tile_size * 0.25, quality);

        draw_maptip_q(build_icons_ctx, maptip.pen1, icon_w * 0 + tile_size * 0.25, icon_h * 2 - tile_size * 0.2, quality);
        draw_maptip_q(build_icons_ctx, maptip.pen2, icon_w * 1 + tile_size * 0.25, icon_h * 2 - tile_size * 0.2, quality);
        draw_maptip_q(build_icons_ctx, maptip.pen_line, icon_w * 2 + tile_size * 0.25, icon_h * 2 - tile_size * 0.2, quality);
        draw_maptip_q(build_icons_ctx, maptip.pen_rect, icon_w * 3 + tile_size * 0.5, icon_h * 2 - tile_size * 0.25, quality);
    };
    this.set_build_cursor = function(idx) {
        //const parent = document.getElementById('indicator-build-icons');
        const x = (idx >> 1) * ICON_W + 300;
        const y = ((idx & 1) !== 0 ? ICON_H : 0) + 40;
        build_icon_hilight.style.left = x + 'px';
        build_icon_hilight.style.top = y + 'px';
    };
    this.set_cursor_size = function(size) {
        cursor_size = size;
    };
    function vehicle_rotate_cw(self, o) {
        if (o.dir >= 0) {
            o.dir += 2;
            if (o.dir >= 8) {
                o.dir -= 8;
            }
            let x = o.x;
            o.x = map_size * 16 - o.y;
            o.y = x;
            let dx = o.dx;
            o.dx = -o.dy;
            o.dy = dx;
        }
    }
    function vehicle_rotate_ccw(self, o) {
        if (o.dir >= 0) {
            o.dir -= 2;
            if (o.dir < 0) {
                o.dir += 8;
            }
            let x = o.x;
            o.x = o.y;
            o.y = map_size * 16 - x;
            let dx = o.dx;
            o.dx = o.dy;
            o.dy = -dx;
        }
    }
    this.rotate_cw = function() {
        let map_center_y = Math.floor(map_size * 16 * scale);
        let view_center_x = Math.floor(this.client_width / 2);
        let view_center_y = Math.floor(this.client_height / 2);
        let offset_x = current_scroll_x - view_center_x;
        let offset_y = (current_scroll_y - view_center_y + map_center_y) * 2;
        current_scroll_x = -offset_y + view_center_x;
        current_scroll_y = Math.floor(offset_x / 2) + view_center_y - map_center_y;
        vehicle_rotate_cw(this, this.airplane);
        vehicle_rotate_cw(this, this.helicopter);
        vehicle_rotate_cw(this, this.container_ship);
        vehicle_rotate_cw(this, this.tornado);
        vehicle_rotate_cw(this, this.monster);
        if (this.train_ticks >= 0) {
            for (let i = 0; i < this.train.length; i++) {
                let t = this.train[i];
                if (t.d1 >= 0) {
                    t.d1 = (t.d1 < 3 ? t.d1 + 1 : 0);
                }
                if (t.d2 >= 0) {
                    t.d2 = (t.d2 < 3 ? t.d2 + 1 : 0);
                }
                let x = t.x;
                t.x = map_size - t.y - 1;
                t.y = x;
            }
        }
    };
    this.rotate_ccw = function() {
        let map_center_y = Math.floor(map_size * 16 * scale);
        let view_center_x = Math.floor(this.client_width / 2);
        let view_center_y = Math.floor(this.client_height / 2);
        let offset_x = current_scroll_x - view_center_x;
        let offset_y = (current_scroll_y - view_center_y + map_center_y) * 2;
        current_scroll_x = offset_y + view_center_x;
        current_scroll_y = -Math.floor(offset_x / 2) + view_center_y - map_center_y;
        vehicle_rotate_ccw(this, this.airplane);
        vehicle_rotate_ccw(this, this.helicopter);
        vehicle_rotate_ccw(this, this.container_ship);
        vehicle_rotate_ccw(this, this.tornado);
        vehicle_rotate_ccw(this, this.monster);
        if (this.train_ticks >= 0) {
            for (let i = 0; i < this.train.length; i++) {
                let t = this.train[i];
                if (t.d1 >= 0) {
                    t.d1 = (t.d1 < 1 ? 3 : t.d1 - 1);
                }
                if (t.d2 >= 0) {
                    t.d2 = (t.d2 < 1 ? 3 : t.d2 - 1);
                }
                let x = t.x;
                t.x = t.y;
                t.y = map_size - x - 1;
            }
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////

    this.set_speed_button = function(speed) {
        const on = 'fill:#ffffff';
        const off = 'fill:#808080';
        document.getElementById('speed-pause-back').setAttribute('style', (speed === 'pause' || speed === 'emergency') ? on : off);
        document.getElementById('speed-normal-back').setAttribute('style', speed === 'normal' ? on : off);
        document.getElementById('speed-fast-back').setAttribute('style', speed === 'fast' ? on : off);
    };

    function update_demand_sub(rect, val) {
        let y = 68;
        let h = 0;
        if (val > 0) {
            h = Math.round(val * 40);
            y = 58 - h;
        } else if (val < 0) {
            h = Math.round(-val * 40);
            y = 78;
        }
        rect.setAttribute('y', y);
        rect.setAttribute('height', h);
    }
    this.update_demand_bar = function(city) {
        update_demand_sub(document.getElementById('demand-bar-r'), city.r_demand);
        update_demand_sub(document.getElementById('demand-bar-c'), city.c_demand);
        update_demand_sub(document.getElementById('demand-bar-i'), city.i_demand);
    };
    this.disaster_alert = function(ticks) {
        let bgcolor;
        if (ticks >= 0) {
            let r = ticks % 20;
            if (r > 10) {
                r = 19 - r;
            }
            bgcolor = 'rgb(' + (r * 10 + 50) + ',0,0)';
        } else {
            bgcolor = '';
            document.getElementById('indicator-build-icons').style.display = '';
        }
        document.body.style.background = bgcolor;
    };

    this.draw_wallpaper_full = function(mode, population) {
        // canvas.resize
        if (main_view_wrapper.clientWidth !== this.client_width || main_view_wrapper.clientHeight !== this.client_height) {
            this.client_width = main_view_wrapper.clientWidth;
            this.client_height = main_view_wrapper.clientHeight;
            set_canvas_size(main_view, this.client_width, this.client_height - 3);
            main_view_ctx = main_view.getContext('2d');
            this.draw_wallpaper(main_view, main_view_ctx, mode, population);
        }
    };
    function draw_wallpaper_building(ctx, width, horz, mode, level) {
        if (level === 1) {
            switch (Math.floor(Math.random() * 4)) {
            case 0:
                break;
            case 1:
                break;
            case 2:
                break;
            case 3:
                break;
            }
        } else {
        }
    }
    this.draw_wallpaper = function(cvs, ctx, mode, population) {
        let width = cvs.width;
        let height = cvs.height;
        let h2 = Math.floor(height / 2);
        let horz = h2 + 150 * quality;
        if (ctx == null) {
            ctx = cvs.getContext('2d');
        }

        let gr = ctx.createLinearGradient(0, h2 - 300 * quality, 0, horz);
        let ground;
        let building;
        let window;
        switch (mode) {
        case 'day':
            gr.addColorStop(0, '#8080ff');
            gr.addColorStop(1, '#e0e0ff');
            ground = '#40a050';
            building = '#ffffff';
            window = '#000080';
            break;
        case 'night':
            gr.addColorStop(0, '#000000');
            gr.addColorStop(1, '#000080');
            ground = '#000000';
            building = '#000000';
            window = '#a0a000';
            break;
        case 'disaster':
            gr.addColorStop(0, '#800000');
            gr.addColorStop(1, '#ff0000');
            ground = '#000000';
            building = '#000000';
            window = '#000000';
            break;
        }
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, width, horz);
        ctx.fillStyle = ground;
        ctx.fillRect(0, horz, width, height - horz);
        if (mode === 'night') {
            ctx.fillStyle = '#ffff00';
            for (let i = 0; i < 50; i++) {
                ctx.fillRect(Math.random() * width, Math.random() * horz, 2, 2);
            }
        }
        if (population >= 500000) {
            for (let i = 0; i < 10; i++) {
                draw_wallpaper_building(ctx, width, horz, mode, 2);
            }
        } else if (population >= 100000) {
            for (let i = 0; i < 10; i++) {
                draw_wallpaper_building(ctx, width, horz, mode, 2);
            }
        } else if (population >= 50000) {
            for (let i = 0; i < 5; i++) {
                draw_wallpaper_building(ctx, width, horz, mode, 1);
            }
            for (let i = 0; i < 5; i++) {
                draw_wallpaper_building(ctx, width, horz, mode, 2);
            }
        } else if (population >= 10000) {
            for (let i = 0; i < 10; i++) {
                draw_wallpaper_building(ctx, width, horz, mode, 1);
            }
        } else if (population >= 2000) {
            for (let i = 0; i < 5; i++) {
                draw_wallpaper_building(ctx, width, horz, mode, 1);
            }
        }
    };
    this.draw_wallpaper_room = function(cvs, gift1, gift2) {
        let width = cvs.width;
        let height = cvs.height;
        let h2 = Math.floor(height / 2);
        let horz = h2 + 150;
        let ctx = cvs.getContext('2d');

        ctx.fillStyle = '#d8c0b8';
        ctx.fillRect(0, 0, width, horz);
        ctx.fillStyle = '#402030';
        ctx.fillRect(0, h2 + 150, width, height - horz);

        ctx.strokeStyle = '#808060';
        ctx.fillStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.rect(40, 210, 256, 128);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (gift2 == null) {
            if (gift1 != null) {
                draw_building_tile(ctx, gift1, 40 + 128, 210 + 64, 1);
            }
        } else {
            draw_building_tile(ctx, gift1, 40 + 62, 210 + 64, 0.625);
            draw_building_tile(ctx, gift2, 40 + 192, 210 + 64, 0.625);
        }
    };
    this.draw_popup_window_picture = function(cvs, type) {
        if (POPUP_PICTURE[type]) {
            let img = new Image();
            img.addEventListener('load', () => {
                let ctx = cvs.getContext('2d');
                let width = img.width;
                let height = img.height;
                let x = (640 - width) * quality;
                let y = (480 - height) * quality;
                ctx.drawImage(img, 0, 0, width, height, x, y, width * quality, height * quality);
            });
            img.setAttribute('src', 'images/' + POPUP_PICTURE[type]);
        }
    };

    this.show_message_ticker = function(msg, priority) {
        this.show_message_ticker_raw(resource.gettext(msg).replace(/\n.*/, ''), priority);
    };
    this.show_message_ticker_raw = function(msg, priority) {
        if (!message_ticker_priority || priority) {
            if (msg != null) {
                message_ticker_priority = priority;
                message_ticker_count = 50;
                document.getElementById('message-ticker').style.display = 'block';
                document.getElementById('message-ticker-content').textContent = msg;
            } else {
                message_ticker_count = 0;
                message_ticker_priority = false;
                document.getElementById('message-ticker').style.display = '';
            }
        }
    };
    this.message_ticker_tick = function() {
        if (message_ticker_count > 0) {
            message_ticker_count--;
            if (message_ticker_count === 0) {
                message_ticker_priority = false;
                document.getElementById('message-ticker').style.display = '';
            }
        }
    };
}
