import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
    static peruDocument(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const val = control.value;
            if (!val) return null;

            const dniRegex = /^\d{8}$/;
            const rucRegex = /^(10|20)\d{9}$/;

            if (dniRegex.test(val) || rucRegex.test(val)) {
                return null;
            }

            return { invalidDocument: true };
        };
    }
    static peruPhone(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const val = control.value;
            if (!val) return null;

            const phoneRegex = /^9\d{8}$/;
            return phoneRegex.test(val) ? null : { invalidPhone: true };
        };
    }
    static matchFields(matchTo: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.parent) return null;
            const matchingControl = control.parent.get(matchTo);

            if (!matchingControl) return null;

            return control.value === matchingControl.value ? null : { mismatch: true };
        };
    }
}