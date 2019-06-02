'use strict';

function Popup()
{
    const window_back = document.getElementById('popup-window-back');
    const title = document.getElementById('popup-title');
    const content = document.getElementById('popup-text');

    this.show = function() {
        window_back.style.display = 'block';
    };
    this.set_title = function(city, year) {
        title.textContent = city + " " + resource.yearstr(year);
    };
    this.set_content = function(text) {
        content.textContent = text;
    };
    this.set_ok_link = function(link) {
        document.getElementById('popup-ok-link').setAttribute('href', link);
    };

    window_back.addEventListener('click', e => {
        window_back.style.display = '';
    });
    document.getElementById('popup-window').addEventListener('click', e => {
        e.stopPropagation();
    });
    document.getElementById('popup-cancel').addEventListener('click', e => {
        window_back.style.display = '';
    });
}
function ScenarioMessage()
{
    const res = {
        cisco: {
            en: "Damage from the earthquake was minor compared to that of the ensuing fires, which kills 1500 peoples.\nControlling the fires shuld be your initial concern.\nThen clear the rubble and start rebuilding.\nYou have 5 years.",
            ja: "この街を襲った地震は大規模な火災を引き起こしました。火災は何日も続き、1500人もの命が奪われました。\nあなたの使命は、火災を鎮め、瓦礫を撤去し、街を再建することです。\n市長の任期は5年です。",
        },
        bern: {
            en: "The roads here are becoming more congested every day. They demand that you do something about it.\nSome have suggested a railway as the answer, but this would require major rezoning in the downtown area.\nYou have 10 years.",
            ja: "この街の交通渋滞は日に日に悪化しています。あなたの使命は、交通問題を解決することです。\n鉄道の導入が一つの解決策ですが、市街地の大規模な再開発が必要です。\n市長の任期は10年です。",
        },
        tokyo: {
            en: "A large creature has been spotted heading for Tokyo bay. It seems to be attracted to the heavy pollution there.\nTry to control the fires, then rebuild the industrial center.\nYou have 5 years.",
            ja: "巨大な生物が東京湾に出現しました。この生物は公害に汚染された都市に出現するそうです。\nあなたの使命は、火災を鎮め、工業地帯を再建することです。\n市長の任期は5年です。",
        },
        detroit: {
            en: "By 1970, various economic factors pushed the once \"automobile capital of the world\" into resession, then increased crime.\nTry to reduce crime and rebuild the industrial base of the city.\nYou have 10 years.",
            ja: "1970年代、世界の自動車産業の中心だったデトロイトは衰退し、犯罪が増加しました。\nあなたの使命は、犯罪を抑え、工業都市を再建することです。\n市長の任期は10年です。",
        },
        boston: {
            en: "A major meltdown is about to occur at center of the city. The area in the vicinity of the reactor will be contaminated by radiation, forcing you to restructure the city around it. You have 5 years.",
            ja: "街の中心に建てられた原子力発電所がメルトダウンを引き起こし、放射能によって汚染されてしまいました。\nあなたの使命は、街の周辺部を使って復興させることです。\n市長の任期は5年です。",
        },
        rio: {
            en: "In the middle 21st century, the greenhouse effect raises sea levels worldwide. Coastal areas were devastated by flood.\nYou have 10 years to turn this swamp back into a city again.",
            ja: "21世紀中頃には、地球温暖化により世界的に海面が上昇しました。そのため、海に面した地域で洪水が発生しました。\nあなたの使命は、水浸しになった街を再建することです。\n市長の任期は10年です。",
        },
        lasvegas: {
            en: "The world's largest gambling city was attacked by strange flying objects and the city suffered devastated damage.\nYou have 10 years to withstand attack and rebuild the city.",
            ja: "世界最大のカジノ都市は、謎の飛行物体による度重なる攻撃により、壊滅的な被害を受けました。\nあなたの使命は、UFOの攻撃に耐え、街を再建することです。\n市長の任期は10年です。",
        },
        tokyo2: {
            en: "A large creature has been landed at Kamata and the city was devastated by catastrophic disaster.\nYour mission is to rebuild the city to an active metropolis within 10 years.",
            ja: "巨大な生物が蒲田に上陸し、街は壊滅的な被害を受けました。\nあなたの使命は、街を再建し、メトロポリスにすることです。\n市長の任期は10年です。",
        },
    };

    this.gettext = function(lang, city) {
        let m = res[city];
        if (m[lang] != null) {
            return m[lang];
        } else {
            return m.en;
        }
    };
}

(fn => {
    if (document.readyState !== 'loading'){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
})(() => {
    const popup = new Popup();
    const scenario_msg = new ScenarioMessage();
    let lang_select = document.getElementById('lang-select');
    let init_lang = null;

    lang_select.addEventListener('change', e => {
        resource.set_language(lang_select.value, () => {
            document.getElementById('link-menu-help').setAttribute('href', (lang_select.value === 'ja') ? 'docs/help.ja.html' : 'docs/help.en.html');

            {
                let re = document.getElementsByClassName('resource');
                for (let i = 0; i < re.length; i++) {
                    re[i].textContent = resource.gettext(re[i].getAttribute('data-key'));
                }
            }
            {
                let re = document.getElementsByClassName('link-lang-tag');
                for (let i = 0; i < re.length; i++) {
                    let link = re[i].getAttribute('href').replace(/#.*$/, '');
                    if (lang_select.value !== init_lang) {
                        link += '#' + lang_select.value;
                    }
                    re[i].setAttribute('href', link);
                }
            }
            document.getElementById('popup-cancel-text').textContent = resource.gettext('cancel');
            document.getElementById('popup-ok-text').textContent = resource.gettext('ok');
        });
    });

    function city_open(e) {
        let t = e.currentTarget;
        let city_name = t.getElementsByClassName('city-list-name')[0].textContent;
        let year = t.getElementsByClassName('city-list-year')[0].textContent;
        let name = t.getAttribute('data-city');
        popup.set_title(city_name, year);
        popup.set_content(scenario_msg.gettext(resource.current_language, name));
        {
            let link = 'tinycity.html?' + name;
            if (lang_select.value !== init_lang) {
                link += '#' + lang_select.value;
            }
            popup.set_ok_link(link);
        }
        popup.show();
    }

    let li = document.getElementsByClassName('scenario-item');
    for (let i = 0; i < li.length; i++) {
        li[i].addEventListener('click', city_open);
    }

    resource.init(() => {
        for (let i = 0; i < resource.language_menu.length; i++) {
            let m = resource.language_menu[i];
            let option = document.createElement('option');
            option.textContent = m.text_raw;
            option.value = m.value.substr(5);
            lang_select.appendChild(option);
        }
        init_lang = resource.current_language;
        lang_select.value = init_lang;
        lang_select.dispatchEvent(new Event('change'));
    });
});
