namespace StylerAddon {

    // anki specific consts
    const BODY_CLASS                    = 'card';
    const TOP_BUTTONS_ID                = 'topbutsleft';

    // styler consts
    const STYLE_ELEM_ID                 = '__styler_note_css';
    const SELECT_LIST_CLASS             = '__styler_select_list'
    const SELECT_LIST_UNFOLDED_CLASS    = '__styler_select_list_unfolded';
    const DROP_DOWN_LIST_CLASS          = '__styler_drop_down_list';


    interface CardTemplate {
        'name': string;
        'ord': number;

        'qfmt': string;
        'afmt': string;
    }

    let noteCss: string;
    let noteFields: string[];
    let cardSelect: SelectList<CardTemplate>;

    // create cardSelect on page loading
    $(() => {
        const getCardName = (card: CardTemplate): string => { return card.name; };

        let model = new SelectModel<CardTemplate>(getCardName);
        cardSelect = new SelectList($(`#${TOP_BUTTONS_ID}`), model);

        cardSelect.onChoose = (card: CardTemplate | undefined): void => {
            if (card === undefined)
                return;

            styleNoteFields(`<div>${card.qfmt}${card.afmt}</div>`);
        }
    })

    export function loadNote(noteTemplates: CardTemplate[], noteCss_: string, noteFields_: string[]): void {
        noteCss = noteCss_;
        noteFields = noteFields_;
        cardSelect.values.refill(noteTemplates);
    }

    function styleNoteFields(fullCardHtml: string): void {
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

    type HTMLElementClickEvent<T> = JQuery.ClickEvent<HTMLElement, T, HTMLElement, HTMLElement>;


    class SelectModel<T extends ConvertibleToString> {
        private values: T[] = [];
        private converter?: (x: T) => string;

        private insertCb?: (begin: number, count: number) => void
        private resetCb?: () => void

        constructor(converter?: (x: T) => string) {
            this.converter = converter;
        }

        set onInsert(cb: (begin: number, count: number) => void) {
            this.insertCb = cb;
        }

        set onReset(cb: () => void) {
            this.resetCb = cb;
        }

        get length(this: SelectModel<T>): number {
            return this.values.length;
        }

        append(this: SelectModel<T>, ...values: T[]): void {
            this.extend(values);
        }

        extend(this: SelectModel<T>, values: T[]): void {
            let begin = this.values.length;
            let count = values.length;

            this.values.push(...values);
            this.insertCb?.(begin, count);
        }

        refill(this: SelectModel<T>, values: T[]): void {
            this.values = [...values];
            this.resetCb?.();
        }

        clear(this: SelectModel<T>): void {
            this.refill([]);
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


    class SelectList<T extends ConvertibleToString> {
        private button: HTMLElement;
        private listbox: HTMLElement;

        private model: SelectModel<T>;
        private current: number;

        private chooseCb?: (i: T | undefined) => void;

        constructor(parent: JQuery<HTMLElement>, model: SelectModel<T>, current: number = 0) {
            this.model = model;
            this.current = current;

            let $button  = $(`<button class="${SELECT_LIST_CLASS}"></button>`)
                            .click(this.unfold.bind(this))
                            .appendTo(parent);

            let $listbox = $(`<div tabindex="-1" class="${DROP_DOWN_LIST_CLASS}"></div>`)
                            .blur(this.fold.bind(this));

            this.button  = $button.get(0);
            this.listbox = $listbox.get(0);

            this.model.onInsert = this.updateCurrentIndex.bind(this);
            this.model.onReset = this.reset.bind(this);

            this.updateCurrentValue();
        }

        set onChoose(cb: (i: T | undefined) => void) {
            this.chooseCb = cb;
        }

        set currentIndex(index: number) {
            this.current = index;

            this.fold();
            this.updateCurrentValue();
        }

        get values(): SelectModel<T> {
            return this.model;
        }

        private updateCurrentValue(this: SelectList<T>): void {
            if (this.current < 0 || this.current >= this.model.length) {
                this.current = 0;
                this.button.textContent = '';

                this.chooseCb?.(undefined);
                return;
            }

            let val = this.model.get(this.current);
            this.button.textContent = this.model.getStr(this.current);

            this.chooseCb?.(val);
        }

        private updateCurrentIndex(this: SelectList<T>, begin: number, count: number): void {
            if (this.current < begin)
                return;

            this.currentIndex = this.current + count;
        }

        private reset(this: SelectList<T>): void {
            this.current = 0; // reset current

            this.updateCurrentValue();
        }

        private unfold(this: SelectList<T>): void {
            let $button = $(this.button);
            let $listbox = $(this.listbox);

            $listbox.empty();
            $listbox.css({
                backgroundColor:    $button.css('backgroundColor'),
                boxShadow:          $button.css('boxShadow'),
                border:             $button.css('border'),
                borderRadius:       $button.css('borderRadius'),
                display:            'block',
            });

            for(let i = 0; i < this.model.length; ++i) {
                let $option = $(`<div>${this.model.getStr(i)}</div>`)
                                .css('padding', $button.css('padding'))
                                .hover(SelectList.optionFocused, SelectList.optionUnfocused)
                                .click(i, this.choose.bind(this));

                $listbox.append($option);
            }

            $(document.body).append($listbox);

            let pos = $button.offset()!;
            pos.top += $button.outerHeight()!;

            $listbox.offset(pos);

            $listbox.focus();

            $button.addClass(SELECT_LIST_UNFOLDED_CLASS);
        }

        private fold(this: SelectList<T>): void {
            $(this.listbox).css('display', 'none');
            $(this.button).removeClass(SELECT_LIST_UNFOLDED_CLASS);
        }

        private choose(this: SelectList<T>, event: HTMLElementClickEvent<number>): void {
            this.currentIndex = event.data;
        }

        private static optionFocused(this: HTMLElement): void {
            let $this = $(this);
            let bgColor = $this.parent().css('backgroundColor');

            $this.css('background', shadeRgb(0.3, bgColor));
        }

        private static optionUnfocused(this: HTMLElement): void {
            $(this).css('background', "rgba(0,0,0,0)");
        }
    }


    // Helpers

    function shadeRgb(p: number, rgb: string): string {
        const begin = rgb.indexOf('(') + 1;
        const end = rgb.length - 1;

        const [r, g, b, ...a] = rgb.substring(begin, end).split(',');

        const shade = (p: number, x: string): number => { return Math.round(parseInt(x) * p); };
        const tint  = (p: number, x: string): number => { return Math.round(255 - (255 - parseInt(x)) * p); };

        const conv = p < 0 ? tint.bind(null, 1 + Math.max(p, -1)) : shade.bind(null, 1 - Math.min(p, 1));

        return `${rgb.substring(0, begin-1)}(${conv(r)}, ${conv(g)}, ${conv(b)}${a.length > 0 ? ', ' + a[0] : ''})`;
    }

}
