const taber = function () {
        const instance = this;

        const get_parsed_targets = function (link) {
                const elems = link.split('/');
                elems.forEach(((value, index, array) => {
                        switch (value) {
                                case '~first':
                                        break;
                                case '~last':
                                        break;
                                case '~next':
                                        let a = getNextChild(array.slice(0, index).join('/'));
                                        break;
                                case '~previous':
                                        break;
                        }
                }));
                return elems;
        };

        const getNextChild = function (first_part_of_id) {
                //TODO-vb: закончил тут.
                const item = $('[data-tab^="${first_part_of_id}/"]');
        }

        /**
         *
         * @param {jQuery} $element
         */
        const openTab = function ($element) {
                const tab_info = get_parsed_targets($element.data('tab'));

                // Показываем активные табы и скрываем остальные
                $(`.tab_active[data-tab^="${tab_info.taber}/"]`)
                        .removeClass('tab_active')
                        .trigger('tab-close');
                $(`[data-tab="${tab_info.taber}/${tab_info.tab}"]`)
                        .addClass('tab_active')
                        .trigger('tab-open');

                // Ставим активный класс для активного переключателя табов и убираем с других
                $(`[data-opentab^="${tab_info.taber}/"]`).removeClass('tab-title-active');
                $(`[data-opentab="${tab_info.taber}/${tab_info.tab}"]`).addClass('tab-title-active');
        }

        /**
         *
         * @param {string|HTMLElement|jQuery} element Элемент, с который хотим открыть.
         */
        instance.openTab = function (element) {
                let $element;
                if (typeof element === "string") {
                        let elems = get_parsed_targets(element);
                        const $tabber = $(`[data-tab^="${elems['taber']}"]`);
                        let active_index;
                        let elem;
                        switch (elems.tab) {
                                case '-previous':
                                        active_index = $tabber.filter('.tab_active').index();
                                        if(active_index >= 0) {
                                                elem = $tabber.filter(`:eq(${active_index - 1})`);
                                                if (elem.length > 0 && elem.data('tab')) {
                                                        elems = get_parsed_targets(elem.data('tab'));
                                                        break;
                                                }
                                        }
                                case '-last':
                                        elems = get_parsed_targets($tabber.filter(':last').data('tab'));
                                        break;
                                case '-next':
                                        active_index = $tabber.filter('.tab_active').index();
                                        elem = $tabber.filter(`:eq(${active_index + 1})`);
                                        if (elem.length > 0 && elem.data('tab')) {
                                                elems = get_parsed_targets(elem.data('tab'));
                                                break;
                                        }
                                case '-first':
                                        elems = get_parsed_targets($tabber.filter(':first').data('tab'));
                                        break;
                        }

                        $element = $(`[data-tab="${elems['taber']}/${elems['tab']}"]`);
                        if ($element.length === 0) {
                                console.error(`Не найден элемент для открытия таба [data-tab="${elems['taber']}/${elems['tab']}"]`);
                        }
                } else {
                        $element = $(element);
                }
                if ($element.length === 0) {
                        console.error(`Нет таба для показа!`, element);
                        return;
                }
                openTab($element);
        };

        const init = function () {
                $(document).on('click', '[data-opentab][data-tab-toggle="click"],[data-opentab]:not([data-tab-toggle])', function (e) {
                        instance.openTab($(e.target).data('opentab'));
                });
                $(document).on('change', '[data-opentab][data-tab-toggle="change"]', function (e) {
                        if ($(e.target).prop('checked')) {
                                instance.openTab($(e.target).data('opentab'));
                        }
                });
        };

        init();
};

window.Taber = new taber();
