import { Component, ElementRef, ViewEncapsulation, afterNextRender, input, signal, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link } from '@tiptap/extension-link';

@Component({
    selector: 'app-rich-text-editor',
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: RichTextEditorComponent,
            multi: true
        }
    ],
    encapsulation: ViewEncapsulation.None,
    template: `
        <div class="rte" [class.rte-focused]="focused()">
            <div class="rte-toolbar" role="toolbar" aria-label="Formato de texto">
                <button type="button" class="rte-btn" (click)="run('undo')" title="Deshacer"><i class="pi pi-history"></i></button>
                <button type="button" class="rte-btn" (click)="run('redo')" title="Rehacer"><i class="pi pi-replay"></i></button>
                <span class="rte-sep"></span>
                <button type="button" class="rte-btn rte-btn-bold" [class.rte-btn-active]="isActive('bold')" (click)="run('bold')" title="Negrita">B</button>
                <button type="button" class="rte-btn rte-btn-italic" [class.rte-btn-active]="isActive('italic')" (click)="run('italic')" title="Cursiva">I</button>
                <button type="button" class="rte-btn rte-btn-strike" [class.rte-btn-active]="isActive('strike')" (click)="run('strike')" title="Tachado">S</button>
                <button type="button" class="rte-btn" [class.rte-btn-active]="isActive('link')" (click)="setLink()" title="Enlace"><i class="pi pi-link"></i></button>
                <span class="rte-sep"></span>
                <button type="button" class="rte-btn rte-btn-label" [class.rte-btn-active]="isActive('h2')" (click)="run('h2')" title="Encabezado 2">H2</button>
                <button type="button" class="rte-btn rte-btn-label" [class.rte-btn-active]="isActive('h3')" (click)="run('h3')" title="Encabezado 3">H3</button>
                <button type="button" class="rte-btn rte-btn-label" (click)="run('paragraph')" title="Párrafo">P</button>
                <span class="rte-sep"></span>
                <button type="button" class="rte-btn" [class.rte-btn-active]="isActive('bulletList')" (click)="run('bulletList')" title="Lista con viñetas"><i class="pi pi-list"></i></button>
                <button type="button" class="rte-btn rte-btn-num" [class.rte-btn-active]="isActive('orderedList')" (click)="run('orderedList')" title="Lista numerada">1.</button>
                <button type="button" class="rte-btn rte-btn-label" [class.rte-btn-active]="isActive('blockquote')" (click)="run('blockquote')" title="Cita">❝</button>
                <span class="rte-sep"></span>
                <button type="button" class="rte-btn" (click)="run('clear')" title="Limpiar formato"><i class="pi pi-eraser"></i></button>
            </div>
            <div class="rte-content" #editorEl [style.min-height]="minHeight()"></div>
        </div>
    `,
    styles: [
        `
            .rte {
                border: 1px solid var(--surface-border);
                border-radius: 6px;
                background: var(--surface-card);
                overflow: hidden;
            }

            .rte.rte-focused {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 0.2rem var(--primary-color);
            }

            .rte-toolbar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.125rem;
                padding: 0.375rem 0.5rem;
                border-bottom: 1px solid var(--surface-border);
                background: var(--surface-ground);
            }

            .rte-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 1.75rem;
                height: 1.75rem;
                padding: 0 0.25rem;
                border-radius: 0.375rem;
                background: transparent;
                color: var(--text-color);
                cursor: pointer;
                font-size: 0.875rem;
                line-height: 1;
            }

            .rte-btn:hover {
                background: var(--surface-hover);
            }

            .rte-btn-active,
            .rte-btn-active:hover {
                background: var(--primary-color);
                color: var(--primary-contrast-color);
            }

            .rte-btn-label {
                min-width: 1.5rem;
                padding: 0 0.375rem;
                font-size: 0.8rem;
                font-weight: 600;
            }

            .rte-btn-bold {
                font-weight: 800;
            }

            .rte-btn-italic {
                font-style: italic;
            }

            .rte-btn-strike {
                text-decoration: line-through;
            }

            .rte-btn-num {
                font-weight: 600;
            }

            .rte-sep {
                width: 1px;
                height: 1.25rem;
                margin: 0 0.25rem;
                background: var(--surface-border);
            }

            .rte-content {
                padding: 0.75rem 1rem;
            }

            .rte-content .tiptap {
                outline: none;
                min-height: inherit;
            }

            .rte-content .tiptap h1,
            .rte-content .tiptap h2,
            .rte-content .tiptap h3 {
                font-weight: 700;
                line-height: 1.2;
            }

            .rte-content .tiptap h1 {
                font-size: 1.5rem;
            }

            .rte-content .tiptap h2 {
                font-size: 1.25rem;
            }

            .rte-content .tiptap h3 {
                font-size: 1.125rem;
            }

            .rte-content .tiptap ul,
            .rte-content .tiptap ol {
                padding-left: 1.25rem;
            }

            .rte-content .tiptap ul {
                list-style: disc;
            }

            .rte-content .tiptap ol {
                list-style: decimal;
            }

            .rte-content .tiptap blockquote {
                border-left: 3px solid var(--surface-border);
                padding-left: 0.75rem;
                color: var(--text-color-secondary);
            }

            .rte-content .tiptap a {
                color: var(--primary-color);
                text-decoration: underline;
                cursor: pointer;
            }

            .rte-content .tiptap p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left;
                height: 0;
                color: var(--text-color-secondary);
                pointer-events: none;
            }
        `
    ]
})
export class RichTextEditorComponent implements ControlValueAccessor {
    minHeight = input<string>('150px');
    placeholder = input<string>('Escribe aquí...');

    focused = signal(false);
    active = signal<string[]>([]);

    private editorEl = viewChild<ElementRef<HTMLDivElement>>('editorEl');

    private editor!: Editor;
    private internalValue = '';
    private skipOnUpdate = false;

    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        afterNextRender(() => {
            this.createEditor();
        });
    }

    private createEditor() {
        const el = this.editorEl()?.nativeElement;
        if (!el) return;

        this.editor = new Editor({
            element: el,
            extensions: [StarterKit, Placeholder.configure({ placeholder: this.placeholder() }), Link.configure({ openOnClick: false, autolink: true })],
            content: this.internalValue,
            onUpdate: ({ editor }) => {
                if (!this.skipOnUpdate) {
                    this.internalValue = editor.getHTML();
                    this.onChange(this.internalValue);
                }
                this.updateActiveStates();
            },
            onSelectionUpdate: () => this.updateActiveStates(),
            onTransaction: () => this.updateActiveStates(),
            onFocus: () => this.focused.set(true),
            onBlur: () => {
                this.focused.set(false);
                this.onTouched();
            }
        });
    }

    run(command: string) {
        if (!this.editor) return;
        const chain = this.editor.chain().focus();

        switch (command) {
            case 'undo':
                chain.undo().run();
                break;
            case 'redo':
                chain.redo().run();
                break;
            case 'bold':
                chain.toggleBold().run();
                break;
            case 'italic':
                chain.toggleItalic().run();
                break;
            case 'strike':
                chain.toggleStrike().run();
                break;
            case 'h1':
                chain.toggleHeading({ level: 1 }).run();
                break;
            case 'h2':
                chain.toggleHeading({ level: 2 }).run();
                break;
            case 'h3':
                chain.toggleHeading({ level: 3 }).run();
                break;
            case 'paragraph':
                chain.setParagraph().run();
                break;
            case 'bulletList':
                chain.toggleBulletList().run();
                break;
            case 'orderedList':
                chain.toggleOrderedList().run();
                break;
            case 'blockquote':
                chain.toggleBlockquote().run();
                break;
            case 'clear':
                chain.unsetAllMarks().clearNodes().run();
                break;
        }
    }

    setLink() {
        if (!this.editor) return;
        const previous = (this.editor.getAttributes('link')['href'] as string | undefined) ?? '';
        const url = window.prompt('URL del enlace', previous || 'https://');

        if (url === null) return;

        if (url === '') {
            this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }

    isActive(name: string): boolean {
        return this.active().includes(name);
    }

    private updateActiveStates() {
        if (!this.editor) return;

        const e = this.editor;
        const list: string[] = [];

        if (e.isActive('bold')) list.push('bold');
        if (e.isActive('italic')) list.push('italic');
        if (e.isActive('strike')) list.push('strike');
        if (e.isActive('link')) list.push('link');
        if (e.isActive('heading', { level: 1 })) list.push('h1');
        if (e.isActive('heading', { level: 2 })) list.push('h2');
        if (e.isActive('heading', { level: 3 })) list.push('h3');
        if (e.isActive('bulletList')) list.push('bulletList');
        if (e.isActive('orderedList')) list.push('orderedList');
        if (e.isActive('blockquote')) list.push('blockquote');

        this.active.set(list);
    }

    writeValue(value: string | null | undefined): void {
        this.internalValue = value ?? '';

        if (this.editor) {
            this.skipOnUpdate = true;
            this.editor.commands.setContent(this.internalValue, { emitUpdate: false });
            this.skipOnUpdate = false;
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
}
