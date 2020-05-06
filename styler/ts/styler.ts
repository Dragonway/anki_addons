namespace StylerAddon {

    const BODY_CLASS    = 'card';
    const STYLE_ELEM_ID = '__styler_note_css';

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

}
