namespace StylerAddon {

    const BODY_CLASS    = 'card';
    const STYLE_ELEM_ID = '__styler_note_css';

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
