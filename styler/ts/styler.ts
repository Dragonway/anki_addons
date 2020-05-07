namespace StylerAddon {

    // anki specific consts
    const BODY_CLASS                    = 'card';

    // styler consts
    const STYLE_ELEM_ID                 = '__styler_note_css';
    const SELECT_LIST_CLASS             = '__styler_select_list'
    const SELECT_LIST_UNFOLDED_CLASS    = '__styler_select_list_unfolded';
    const DROP_DOWN_LIST_CLASS          = '__styler_drop_down_list';

    function shadeRgb(p: number, rgb: string): string {
        const begin = rgb.indexOf('(') + 1;
        const end = rgb.length - 1;

        const [r, g, b, ...a] = rgb.substring(begin, end).split(',');

        const shade = (p: number, x: string): number => { return Math.round(parseInt(x) * p); };
        const tint  = (p: number, x: string): number => { return Math.round(255 - (255 - parseInt(x)) * p); };

        const conv = p < 0 ? tint.bind(null, 1 + Math.max(p, -1)) : shade.bind(null, 1 - Math.min(p, 1));

        return `${rgb.substring(0, begin-1)}(${conv(r)}, ${conv(g)}, ${conv(b)}${a.length > 0 ? ', ' + a[0] : ''})`;
    }

    export function styleNoteFields(fullCardHtml: string, noteCss: string, noteFields: string[]): void {
        let card = $(fullCardHtml);

        $(`#${STYLE_ELEM_ID}`).text(noteCss);

        for (let i = 0; i < noteFields.length; ++i) {
            let field = $(`#f${i}`);
            let fieldName = noteFields[i];

            field.addClass(BODY_CLASS);

            let elem = card.find(`div:contains("{{${fieldName}}}")`);

            let elemClass = elem.attr("class");
            if (elemClass === undefined)
                continue;

            field.addClass(elemClass);
        }
    }


    interface ConvertibleToString {
        toString: () => string
    }


    class SelectModel<T extends ConvertibleToString> {
        private values: T[] = [];
        private converter?: (x: T) => string;
        private updateCb?: () => void

        constructor(converter?: (x: T) => string, updateCb? : () => void) {
            this.converter = converter;
            this.updateCb = updateCb;
        }

        set onUpdate(cb: () => void) {
            this.updateCb = cb;
        }

        get length(this: SelectModel<T>): number {
            return this.values.length;
        }

        append(this: SelectModel<T>, value: T): void {
            this.values.push(value);
            this.updateCb?.();
        }

        extend(this: SelectModel<T>, values: T[]): void {
            this.values.push.apply(this.values, values);
            this.updateCb?.();
        }

        clear(this: SelectModel<T>): void {
            this.values = [];
            this.updateCb?.();
        }

        toString(this: SelectModel<T>): string {
            return this.values.toString();
        }

        get(this: SelectModel<T>, index: number): T {
            return this.values[index];
        }

        getStr(this: SelectModel<T>, index: number): string {
            return this.converter?.(this.values[index]) ?? this.values[index].toString();
        }
    }


    class SelectList<T> {
        private button: HTMLElement;
        private listbox: HTMLElement;

        private model: SelectModel<T>;
        private current: number;

        constructor(parent: JQuery<HTMLElement>, model: SelectModel<T>, current: number = 0) {
            this.model = model;
            this.current = current;

            let value = this.model.getStr(this.current);
            let $button  = $(`<button class="${SELECT_LIST_CLASS}">${value}</button>`)
                            .click(this.unfold.bind(this))
                            .appendTo(parent);

            let $listbox = $(`<div tabindex="-1" class="${DROP_DOWN_LIST_CLASS}"></div>`)
                            .blur(this.fold.bind(this))
                            .css({
                                backgroundColor:    $button.css('backgroundColor'),
                                boxShadow:          $button.css('boxShadow'),
                            });

            this.button  = $button.get(0);
            this.listbox = $listbox.get(0);

            this.model.onUpdate = this.fold.bind(this);
        }

        private unfold(this: SelectList<T>): void {
            let $button = $(this.button);
            let $listbox = $(this.listbox);

            $listbox.empty();
            for(let i = 0; i < this.model.length; ++i) {
                let $option = $(`<div>${this.model.getStr(i)}</div>`);

                $option.css('padding', $button.css('padding'));
                $option.hover(this.optionFocused, this.optionUnfocused);

                $listbox.append($option);
            }

            $(document.body).append($listbox);

            let pos = $button.offset()!;
            pos.top += $button.outerHeight()!;

            $listbox.offset(pos);

            $listbox.focus();

            $button.toggleClass(SELECT_LIST_UNFOLDED_CLASS, true);
        }

        private fold(this: SelectList<T>): void {
            $(this.listbox).detach();
            $(this.button).toggleClass(SELECT_LIST_UNFOLDED_CLASS, false);
        }

        private optionFocused(this: HTMLElement): void {
            let $this = $(this);
            let bgColor = $this.parent().css('backgroundColor');

            $this.css('background', shadeRgb(0.3, bgColor));
        }

        private optionUnfocused(this: HTMLElement): void {
            $(this).css('background', "rgba(0,0,0,0)");
        }
    }

}
