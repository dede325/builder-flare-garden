import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationRule {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  required?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  info: ValidationRule[];
}

interface FormValidationProps {
  validationResult: ValidationResult;
  showSuccess?: boolean;
  className?: string;
}

export function FormValidation({ 
  validationResult, 
  showSuccess = true, 
  className 
}: FormValidationProps) {
  const { isValid, errors, warnings, info } = validationResult;

  if (isValid && showSuccess && errors.length === 0 && warnings.length === 0) {
    return (
      <Alert className={cn("border-green-200 bg-green-50 dark:bg-green-950/20", className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          Todos os campos estão válidos. ✓
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Errors */}
      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-red-700 dark:text-red-400">
                Corrija os seguintes erros:
              </p>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <Badge variant="destructive" className="text-xs">
                      {error.field}
                    </Badge>
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                Avisos importantes:
              </p>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                      {warning.field}
                    </Badge>
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info */}
      {info.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-blue-700 dark:text-blue-400">
                Informações úteis:
              </p>
              <ul className="space-y-1">
                {info.map((infoItem, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {infoItem.field}
                    </Badge>
                    {infoItem.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Hook para validação de formulários
export function useFormValidation() {
  const validateCleaningForm = (formData: any): ValidationResult => {
    const errors: ValidationRule[] = [];
    const warnings: ValidationRule[] = [];
    const info: ValidationRule[] = [];

    // Validações obrigatórias
    if (!formData.aircraftId) {
      errors.push({
        field: 'Aeronave',
        message: 'Selecione uma aeronave',
        type: 'error',
        required: true
      });
    }

    if (!formData.employees || formData.employees.length === 0) {
      errors.push({
        field: 'Funcionários',
        message: 'Adicione pelo menos um funcionário',
        type: 'error',
        required: true
      });
    }

    if (!formData.interventionTypes || formData.interventionTypes.length === 0) {
      errors.push({
        field: 'Tipos de Intervenção',
        message: 'Selecione pelo menos um tipo de intervenção',
        type: 'error',
        required: true
      });
    }

    if (!formData.location?.trim()) {
      errors.push({
        field: 'Local',
        message: 'Especifique o local da intervenção',
        type: 'error',
        required: true
      });
    }

    if (!formData.shift) {
      errors.push({
        field: 'Turno',
        message: 'Selecione o turno de trabalho',
        type: 'error',
        required: true
      });
    }

    // Validações de dados de funcionários
    if (formData.employees) {
      formData.employees.forEach((emp: any, index: number) => {
        if (!emp.name?.trim()) {
          errors.push({
            field: `Funcionário ${index + 1}`,
            message: 'Nome é obrigatório',
            type: 'error'
          });
        }

        if (!emp.task?.trim()) {
          errors.push({
            field: `Funcionário ${index + 1}`,
            message: 'Tarefa é obrigatória',
            type: 'error'
          });
        }

        if (!emp.startTime) {
          warnings.push({
            field: `Funcionário ${index + 1}`,
            message: 'Hora de início não definida',
            type: 'warning'
          });
        }

        if (!emp.photo) {
          warnings.push({
            field: `Funcionário ${index + 1}`,
            message: 'Foto do funcionário não adicionada',
            type: 'warning'
          });
        }
      });
    }

    // Validações de assinaturas
    if (!formData.supervisorSignature) {
      warnings.push({
        field: 'Assinatura',
        message: 'Assinatura do supervisor não capturada',
        type: 'warning'
      });
    }

    if (!formData.clientSignature && !formData.clientConfirmed) {
      info.push({
        field: 'Cliente',
        message: 'Considere obter assinatura ou confirmação do cliente',
        type: 'info'
      });
    }

    // Informações úteis
    if (formData.employees && formData.employees.length > 5) {
      info.push({
        field: 'Equipe',
        message: `Equipe grande (${formData.employees.length} funcionários) - verifique se todos são necessários`,
        type: 'info'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  };

  const validateEmployee = (employeeData: any): ValidationResult => {
    const errors: ValidationRule[] = [];
    const warnings: ValidationRule[] = [];
    const info: ValidationRule[] = [];

    // Validações obrigatórias
    if (!employeeData.name?.trim()) {
      errors.push({
        field: 'Nome',
        message: 'Nome completo é obrigatório',
        type: 'error',
        required: true
      });
    }

    if (!employeeData.email?.trim()) {
      errors.push({
        field: 'Email',
        message: 'Email é obrigatório',
        type: 'error',
        required: true
      });
    } else if (!/\S+@\S+\.\S+/.test(employeeData.email)) {
      errors.push({
        field: 'Email',
        message: 'Formato de email inválido',
        type: 'error'
      });
    }

    if (!employeeData.phone?.trim()) {
      warnings.push({
        field: 'Telefone',
        message: 'Telefone não informado',
        type: 'warning'
      });
    }

    if (!employeeData.department?.trim()) {
      warnings.push({
        field: 'Departamento',
        message: 'Departamento não especificado',
        type: 'warning'
      });
    }

    if (!employeeData.photo) {
      info.push({
        field: 'Foto',
        message: 'Adicionar foto ajuda na identificação',
        type: 'info'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  };

  return {
    validateCleaningForm,
    validateEmployee
  };
}

export type { ValidationRule, ValidationResult };
