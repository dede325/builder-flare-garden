import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (base64: string | null) => void;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: 'square' | 'landscape' | 'auto';
  className?: string;
}

export function LogoUpload({
  label,
  description,
  value,
  onChange,
  maxWidth = 400,
  maxHeight = 200,
  aspectRatio = 'auto',
  className
}: LogoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    try {
      const resizedImage = await resizeImage(file, maxWidth, maxHeight);
      setPreview(resizedImage);
      onChange(resizedImage);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para base64
        const base64 = canvas.toDataURL('image/png', 0.9);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'landscape':
        return 'aspect-[2/1]';
      default:
        return 'aspect-[3/2]';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {preview ? (
            <div className={cn('relative group', getAspectRatioClass())}>
              <img
                src={preview}
                alt="Preview do logo"
                className="w-full h-full object-contain bg-gray-50 dark:bg-gray-900"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Alterar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors',
                'hover:border-blue-400 dark:hover:border-blue-500',
                isDragging && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
                getAspectRatioClass()
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Arraste uma imagem aqui
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  ou clique para selecionar
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  PNG, JPG até {maxWidth}x{maxHeight}px
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Input
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        ref={fileInputRef}
      />
    </div>
  );
}
