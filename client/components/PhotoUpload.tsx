import { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PhotoUploadProps {
  currentPhoto?: string;
  onPhotoChange: (photoDataURL: string | null) => void;
  employeeName: string;
}

export default function PhotoUpload({ currentPhoto, onPhotoChange, employeeName }: PhotoUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Arquivo muito grande. Selecione uma imagem menor que 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);
      setIsCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewPhoto(dataURL);
        stopCamera();
      }
    }
  };

  const savePhoto = () => {
    onPhotoChange(previewPhoto);
    setIsDialogOpen(false);
    setPreviewPhoto(null);
    stopCamera();
  };

  const removePhoto = () => {
    onPhotoChange(null);
    setPreviewPhoto(null);
    setIsDialogOpen(false);
    stopCamera();
  };

  const cancelUpload = () => {
    setPreviewPhoto(null);
    setIsDialogOpen(false);
    stopCamera();
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        {currentPhoto ? (
          <div className="relative">
            <img 
              src={currentPhoto} 
              alt={`Foto de ${employeeName}`}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white"
              onClick={() => onPhotoChange(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-dashed border-white/30 flex items-center justify-center">
            <User className="h-6 w-6 text-white/70" />
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="border-white/30 text-white hover:bg-white/20"
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-aviation-gray-800 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {currentPhoto ? 'Alterar Foto' : 'Adicionar Foto'} - {employeeName}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Tire uma foto ou faça upload de uma imagem existente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!isCamera && !previewPhoto && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={startCamera}
                  className="aviation-button h-20 flex-col"
                >
                  <Camera className="h-8 w-8 mb-2" />
                  Usar Câmera
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/20 h-20 flex-col"
                >
                  <Upload className="h-8 w-8 mb-2" />
                  Escolher Arquivo
                </Button>
              </div>
            )}

            {isCamera && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={capturePhoto} className="aviation-button flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capturar Foto
                  </Button>
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {previewPhoto && (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={previewPhoto} 
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border border-white/30"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={savePhoto} className="aviation-button flex-1">
                    Confirmar Foto
                  </Button>
                  <Button 
                    onClick={cancelUpload} 
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    Tentar Novamente
                  </Button>
                  {currentPhoto && (
                    <Button 
                      onClick={removePhoto} 
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remover Foto
                    </Button>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
