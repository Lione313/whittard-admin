import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';

@Component({
    selector: 'app-calendar-widget',
    standalone: true,
    imports: [CommonModule, PopoverModule, DatePickerModule, TagModule, BadgeModule, DatePipe,FormsModule],
    template: `
        <div class="relative">
            <button type="button" class="layout-topbar-action" (click)="calendarPopover.toggle($event)">
                <i class="pi pi-calendar"></i>
                <span>Agenda</span>
            </button>

            <p-popover #calendarPopover [style]="{ width: '340px' }">
                <div class="flex flex-col gap-0">

                    <!-- Header -->
                    <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-200 dark:border-surface-700">
                        <div class="flex flex-col gap-0.5">
                            <span class="text-[10px] font-semibold uppercase tracking-widest text-surface-400">Agenda</span>
                            <span class="text-sm font-bold text-surface-900 dark:text-surface-0 capitalize">
                                {{ today | date: 'EEEE, d MMMM' : '' : 'es-PE' }}
                            </span>
                        </div>
                       
                    </div>

                    <!-- Calendario -->
                    <div class="flex justify-center px-2 py-2 border-b border-surface-200 dark:border-surface-700">
                        <p-datepicker
                            [(ngModel)]="selectedDate"
                            [inline]="true"
                            [showWeek]="true"
                            styleClass="w-full border-none shadow-none"
                        />
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between px-4 py-3">
                        <span class="text-xs">
                            <i class="pi pi-clock mr-1"></i>
                            Última actualización: hace 5 min
                        </span>
                        <button class="text-xs font-medium hover:underline">
                            Ver todo
                        </button>
                    </div>

                </div>
            </p-popover>
        </div>
    `
})
export class AppCalendarWidget {
    today = new Date();
    selectedDate = signal<Date>(new Date());
}