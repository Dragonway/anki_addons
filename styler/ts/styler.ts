namespace StylerAddon {

    const BODY_CLASS    = 'card';
    const STYLE_ELEM_ID = '__styler_note_css';

    export function styleNoteFields(full_card_html: string, note_css: string, note_fields: string[]): void {
        let card = $(full_card_html);

        $(`#${STYLE_ELEM_ID}`).text(note_css);

        for (let i = 0; i < note_fields.length; ++i) {
            let field = $(`#f${i}`);
            let field_name = note_fields[i];

            field.addClass(BODY_CLASS);

            let elem = card.find(`div:contains("{{${field_name}}}")`);

            let elem_class = elem.attr("class");
            if (elem_class === undefined)
                continue;

            field.addClass(elem_class);
        }
    }
}
