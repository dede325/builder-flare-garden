import { useState, useEffect } from 'react';
import { QrCode, Download, Eye, Copy, Check, Calendar, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { codeGenerationService } from '@/lib/code-generation-service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QRCodeDisplayProps {
  formCode: string;
  formId: string;
  formData?: {
    date?: string;
    location?: string;
    shift?: string;
    status?: string;
  };
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  showActions?: boolean;
}

export default function QRCodeDisplay({ 
  formCode, 
  formId, 
  formData, 
  size = 'medium',
  showDetails = true,
  showActions = true 
}: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    generateQRCode();
  }, [formCode, formId, size]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const sizeMap = { small: 150, medium: 300, large: 600 };
      const qrCodeDataURL = await codeGenerationService.generateFormQRCode(
        formCode, 
        formId, 
        { width: sizeMap[size] }
      );
      setQrCode(qrCodeDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: "Não foi possível gerar o código QR.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${formCode}.png`;
    link.href = qrCode;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code baixado",
      description: "O código QR foi salvo como imagem.",
    });
  };

  const copyFormCode = async () => {
    try {
      await navigator.clipboard.writeText(formCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Código copiado",
        description: "O código da folha foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const openQRCodeInNewTab = () => {
    if (!qrCode) return;
    
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${formCode}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                text-align: center; 
                font-family: Arial, sans-serif;
                background: #f5f5f5;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              img { 
                max-width: 100%; 
                height: auto;
                border: 1px solid #ddd;
                border-radius: 8px;
              }
              .code {
                font-family: monospace;
                font-size: 18px;
                font-weight: bold;
                margin: 20px 0;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 5px;
              }
              .details {
                text-align: left;
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 5px;
              }
              @media print {
                body { background: white; }
                .container { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>QR Code da Folha de Limpeza</h2>
              <img src="${qrCode}" alt="QR Code ${formCode}" />
              <div class="code">${formCode}</div>
              ${formData ? `
                <div class="details">
                  <h3>Detalhes da Folha</h3>
                  ${formData.date ? `<p><strong>Data:</strong> ${format(new Date(formData.date), 'dd/MM/yyyy', { locale: ptBR })}</p>` : ''}
                  ${formData.location ? `<p><strong>Local:</strong> ${formData.location}</p>` : ''}
                  ${formData.shift ? `<p><strong>Turno:</strong> ${formData.shift === 'morning' ? 'Manhã' : formData.shift === 'afternoon' ? 'Tarde' : 'Noite'}</p>` : ''}
                  ${formData.status ? `<p><strong>Status:</strong> ${formData.status === 'completed' ? 'Concluída' : formData.status === 'pending_signatures' ? 'Aguardando Assinaturas' : 'Rascunho'}</p>` : ''}
                </div>
              ` : ''}
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Escaneie este código para acessar a folha de limpeza digital
              </p>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const parseFormCode = () => {
    return codeGenerationService.parseFormCode(formCode);
  };

  const getFormDate = () => {
    try {
      return codeGenerationService.extractDateFromCode(formCode);
    } catch (error) {
      return null;
    }
  };

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-white/10 rounded-lg border border-white/20 flex items-center justify-center`}>
        <QrCode className="h-8 w-8 text-white/50 animate-pulse" />
      </div>
    );
  }

  if (size === 'small') {
    return (
      <div className="flex items-center space-x-2">
        <div className="relative group">
          <img
            src={qrCode}
            alt={`QR Code ${formCode}`}
            className={`${sizeClasses[size]} object-cover rounded-lg border border-white/30 cursor-pointer`}
            onClick={() => setIsDetailDialogOpen(true)}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Eye className="h-4 w-4 text-white" />
          </div>
        </div>
        
        {showDetails && (
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs text-white truncate">{formCode}</div>
            {formData?.status && (
              <Badge variant="outline" className="text-xs mt-1">
                {formData.status === 'completed' ? 'Concluída' : 
                 formData.status === 'pending_signatures' ? 'Pendente' : 'Rascunho'}
              </Badge>
            )}
          </div>
        )}
        
        <QRCodeDetailDialog 
          isOpen={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          qrCode={qrCode}
          formCode={formCode}
          formData={formData}
          onDownload={downloadQRCode}
          onCopy={copyFormCode}
          onOpen={openQRCodeInNewTab}
          copied={copied}
        />
      </div>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>QR Code da Folha</span>
          </div>
          {formData?.status && (
            <Badge className={`text-xs ${
              formData.status === 'completed' ? 'bg-green-500' :
              formData.status === 'pending_signatures' ? 'bg-yellow-500' : 'bg-gray-500'
            } text-white`}>
              {formData.status === 'completed' ? 'Concluída' : 
               formData.status === 'pending_signatures' ? 'Pendente' : 'Rascunho'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* QR Code Image */}
        <div className="flex justify-center">
          <div className="relative group">
            <img
              src={qrCode}
              alt={`QR Code ${formCode}`}
              className={`${sizeClasses[size]} object-cover rounded-lg border border-white/30 bg-white p-2`}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailDialogOpen(true)}
                className="text-white hover:bg-white/20"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Form Code */}
        <div className="text-center">
          <div className="font-mono text-white font-medium mb-1">{formCode}</div>
          <div className="text-white/70 text-xs">
            Escaneie para acessar a folha digital
          </div>
        </div>

        {/* Form Details */}
        {showDetails && formData && (
          <div className="space-y-2 text-xs">
            {formData.date && (
              <div className="flex items-center space-x-2 text-white/70">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(formData.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            )}
            {formData.location && (
              <div className="flex items-center space-x-2 text-white/70">
                <MapPin className="h-3 w-3" />
                <span>{formData.location}</span>
              </div>
            )}
            {formData.shift && (
              <div className="flex items-center space-x-2 text-white/70">
                <Clock className="h-3 w-3" />
                <span>
                  {formData.shift === 'morning' ? 'Manhã (06:00-14:00)' :
                   formData.shift === 'afternoon' ? 'Tarde (14:00-22:00)' : 'Noite (22:00-06:00)'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyFormCode}
              className="flex-1 border-white/30 text-white hover:bg-white/20"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              className="border-white/30 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDetailDialogOpen(true)}
              className="border-white/30 text-white hover:bg-white/20"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      
      <QRCodeDetailDialog 
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        qrCode={qrCode}
        formCode={formCode}
        formData={formData}
        onDownload={downloadQRCode}
        onCopy={copyFormCode}
        onOpen={openQRCodeInNewTab}
        copied={copied}
      />
    </Card>
  );
}

// Detailed QR Code Dialog Component
function QRCodeDetailDialog({
  isOpen,
  onOpenChange,
  qrCode,
  formCode,
  formData,
  onDownload,
  onCopy,
  onOpen,
  copied
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  formCode: string;
  formData?: any;
  onDownload: () => void;
  onCopy: () => void;
  onOpen: () => void;
  copied: boolean;
}) {
  const parsedCode = codeGenerationService.parseFormCode(formCode);
  const formDate = codeGenerationService.extractDateFromCode(formCode);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-aviation-gray-800 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            QR Code da Folha de Limpeza
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Código único e QR code para acesso digital à folha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Large QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <img
                src={qrCode}
                alt={`QR Code ${formCode}`}
                className="w-64 h-64 object-cover"
              />
            </div>
          </div>

          {/* Form Code Details */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-white mb-2">{formCode}</div>
              <div className="text-white/70 text-sm">Código único da folha de limpeza</div>
            </div>

            {/* Code Components */}
            {parsedCode && (
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <h4 className="text-white font-medium text-sm">Componentes do Código:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/70">Prefixo:</div>
                  <div className="text-white font-mono">{parsedCode.prefix}</div>
                  <div className="text-white/70">Série:</div>
                  <div className="text-white font-mono">{parsedCode.series}</div>
                  <div className="text-white/70">Sequência:</div>
                  <div className="text-white font-mono">{parsedCode.sequence}</div>
                  <div className="text-white/70">Timestamp:</div>
                  <div className="text-white font-mono">{parsedCode.timestamp}</div>
                </div>
              </div>
            )}

            {/* Form Information */}
            {formData && (
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <h4 className="text-white font-medium text-sm">Informações da Folha:</h4>
                <div className="space-y-1 text-xs">
                  {formData.date && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Data:</span>
                      <span className="text-white">{format(new Date(formData.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  )}
                  {formData.location && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Local:</span>
                      <span className="text-white">{formData.location}</span>
                    </div>
                  )}
                  {formData.shift && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Turno:</span>
                      <span className="text-white">
                        {formData.shift === 'morning' ? 'Manhã' :
                         formData.shift === 'afternoon' ? 'Tarde' : 'Noite'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generated Date */}
            {formDate && (
              <div className="text-center text-xs text-white/50">
                Gerado em: {format(formDate, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={onCopy}
              variant="outline"
              className="flex-1 border-white/30 text-white hover:bg-white/20"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </Button>
            
            <Button
              onClick={onDownload}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            
            <Button
              onClick={onOpen}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
            >
              <Eye className="h-4 w-4 mr-2" />
              Abrir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
