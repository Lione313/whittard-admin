import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageSection, HeroSliderContent } from '../../../models/content.model';
import { ButtonModule } from 'primeng/button';
import { SlideListComponent } from './hero-slider/slide-list';
import { SlideModalComponent } from './hero-slider/slide-modal';

export type SlideType = 'image' | 'image_link' | 'video';

export interface SlideItem {
    id: number;
    title: string;
    subtitle: string;
    type: SlideType;
    src_desktop: string | File | null;
    src_mobile: string | File | null;
    video_url?: string | File | null;
    url?: string | null;
    sort_order: number;
    is_active: boolean;
    preview_desktop?: string | null;
    preview_mobile?: string | null;
    preview_video?: string | null;
}

@Component({
    selector: 'app-hero-slider-editor',
    standalone: true,
    imports: [CommonModule, ButtonModule, SlideListComponent, SlideModalComponent],
    template: `
        <div class="space-y-6">
            <!-- HEADER -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Slider Principal (Hero)</h2>
                    <p class="text-sm text-surface-500">Administra los slides del banner principal.</p>
                </div>
                <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
            </div>

            <!-- LISTA -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-bold text-surface-800 dark:text-surface-100 flex items-center gap-2">
                        <i class="pi pi-images text-primary"></i>
                        Slides Registrados ({{ slides().length }})
                    </h3>
                    <p-button label="Agregar Slide" icon="pi pi-plus" severity="secondary" size="small" [rounded]="true" (onClick)="openNew()" />
                </div>

                <app-slide-list [slides]="slides()" (add)="openNew()" (edit)="openEdit($event)" (delete)="deleteSlide($event)" (move)="moveSlide($event)" />
            </div>

            <!-- MODAL -->
            @if (currentSlide) {
                <app-slide-modal [visible]="displayModal" [isEditing]="editingIndex !== null" [slideData]="currentSlide" (confirm)="saveSlide($event)" (cancel)="displayModal = false" />
            }
        </div>
    `
})
export class HeroSliderEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<FormData | Record<string, unknown>>();

    slides = signal<SlideItem[]>([]);
    displayModal = false;
    editingIndex: number | null = null;
    currentSlide: SlideItem | null = null;

    ngOnInit(): void {
        if (this.section?.content_data?.content) {
            const raw = this.section.content_data.content as HeroSliderContent;
            this.slides.set(raw.slides ?? []);
        }
    }

    private emptySlide(): SlideItem {
        return {
            id: Date.now(),
            title: '',
            subtitle: '',
            type: 'image',
            src_desktop: null,
            src_mobile: null,
            video_url: null,
            url: null,
            sort_order: this.slides().length + 1,
            is_active: true
        };
    }

    openNew(): void {
        this.editingIndex = null;
        this.currentSlide = this.emptySlide();
        this.displayModal = true;
    }

    openEdit({ slide, index }: { slide: SlideItem; index: number }): void {
        this.editingIndex = index;
        this.currentSlide = { ...slide }; // shallow clone, File refs se preservan
        this.displayModal = true;
    }
    saveSlide(slide: SlideItem): void {
        const list = [...this.slides()];
        if (this.editingIndex !== null) {
            list[this.editingIndex] = { ...slide };
        } else {
            list.push({ ...slide });
        }
        this.slides.set(list);
        this.displayModal = false;
    }

    deleteSlide(index: number): void {
        const list = [...this.slides()];
        list.splice(index, 1);
        this.slides.set(list);
    }

    moveSlide({ index, direction }: { index: number; direction: number }): void {
        const list = [...this.slides()];
        const target = index + direction;
        if (target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
        list.forEach((s, i) => (s.sort_order = i + 1));
        this.slides.set(list);
    }

    onSave(): void {
        const hasFiles = this.slides().some((s) => s.src_desktop instanceof File || s.src_mobile instanceof File || s.video_url instanceof File);

        if (hasFiles) {
            const fd = new FormData();
            this.slides().forEach((s, i) => {
                fd.append(`content[slides][${i}][id]`, String(s.id));
                fd.append(`content[slides][${i}][title]`, s.title || '');
                fd.append(`content[slides][${i}][subtitle]`, s.subtitle || '');
                fd.append(`content[slides][${i}][type]`, s.type);
                fd.append(`content[slides][${i}][url]`, s.url || '');
                fd.append(`content[slides][${i}][sort_order]`, String(i + 1));
                fd.append(`content[slides][${i}][is_active]`, s.is_active ? '1' : '0');

                if (s.src_desktop instanceof File) fd.append(`content[slides][${i}][src_desktop]`, s.src_desktop);
                else fd.append(`content[slides][${i}][src_desktop]`, (s.src_desktop as string) || 'null');

                if (s.src_mobile instanceof File) fd.append(`content[slides][${i}][src_mobile]`, s.src_mobile);
                else fd.append(`content[slides][${i}][src_mobile]`, (s.src_mobile as string) || 'null');

                if (s.video_url instanceof File) fd.append(`content[slides][${i}][video_url]`, s.video_url);
                else fd.append(`content[slides][${i}][video_url]`, (s.video_url as string) || 'null');
            });
            this.save.emit(fd);
        } else {
            this.save.emit({
                slides: this.slides().map((s, i) => ({
                    ...s,
                    sort_order: i + 1,
                    preview_desktop: undefined,
                    preview_mobile: undefined,
                    preview_video: undefined
                }))
            });
        }
    }
}
