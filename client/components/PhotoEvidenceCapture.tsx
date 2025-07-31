import { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  Clock, 
  Tag, 
  User, 
  MapPin,
  AlertCircle,
  Download,
  Eye,
  Grid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { photoEvidenceService } from '@/lib/photo-evidence-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PhotoEvidence {
  id: string;
  formId: string;
  type: 'before' | 'after';
  category: 'exterior' | 'interior' | 'details';
  photoDataURL: string;
  thumbnail: string;
  description: string;
  location?: string;
  gpsCoordinates?: { lat: number; lng: number };
  timestamp: string;
  capturedBy: string;
  capturedByUserId: string;
  fileSize: number;
  resolution: { width: number; height: number };
  tags: string[];
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
  supabaseUrl?: string;
  metadata: {
    device: string;
    userAgent: string;
    orientation: string;
  };
}

interface PhotoEvidenceCaptureProps {
  formId: string;
  formCode: string;
  onPhotosUpdate: (photos: PhotoEvidence[]) => void;
  initialPhotos?: PhotoEvidence[];
  maxPhotosPerCategory?: number;
}

export default function PhotoEvidenceCapture({ 
  formId, 
  formCode, 
  onPhotosUpdate, 
  initialPhotos = [],
  maxPhotosPerCategory = 10 
}: PhotoEvidenceCaptureProps) {
  const [photos, setPhotos] = useState<PhotoEvidence[]>(initialPhotos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload' | null>(null);
  const [currentCapture, setCurrentCapture] = useState<{
    type: 'before' | 'after';
    category: 'exterior' | 'interior' | 'details';
  } | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'before' | 'after'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'exterior' | 'interior' | 'details'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    onPhotosUpdate(photos);
  }, [photos, onPhotosUpdate]);

  useEffect(() => {
    // Load existing photos from offline storage
    loadExistingPhotos();
  }, [formId]);

  const loadExistingPhotos = async () => {
    try {
      const existingPhotos = await photoEvidenceService.getPhotosByForm(formId);
      setPhotos(existingPhotos);
    } catch (error) {
      console.error('Error loading existing photos:', error);
    }
  };

  const startCapture = (type: 'before' | 'after', category: 'exterior' | 'interior' | 'details') => {
    setCurrentCapture({ type, category });
    setIsDialogOpen(true);
    setCaptureMode(null);
    setPreviewPhoto(null);
    setDescription('');
    setCustomTags('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "Selecione uma imagem menor que 10MB.",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato inválido",
          description: "Selecione apenas arquivos de imagem.",
          variant: "destructive"
        });
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
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Use back camera for better quality
        } 
      });
      setStream(mediaStream);
      setIsCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive"
      });
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
        const dataURL = canvas.toDataURL('image/jpeg', 0.9); // High quality
        setPreviewPhoto(dataURL);
        stopCamera();
      }
    }
  };

  const generateThumbnail = (dataURL: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Thumbnail size
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        }
      };
      img.src = dataURL;
    });
  };

  const getGPSLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const savePhoto = async () => {
    if (!previewPhoto || !currentCapture) return;

    try {
      // Generate thumbnail
      const thumbnail = await generateThumbnail(previewPhoto);
      
      // Get GPS location
      const gpsCoordinates = await getGPSLocation();
      
      // Get image resolution
      const img = new Image();
      img.onload = async () => {
        const photoEvidence: PhotoEvidence = {
          id: crypto.randomUUID(),
          formId,
          type: currentCapture.type,
          category: currentCapture.category,
          photoDataURL: previewPhoto,
          thumbnail,
          description: description || `${currentCapture.type === 'before' ? 'Antes' : 'Depois'} - ${currentCapture.category}`,
          gpsCoordinates,
          timestamp: new Date().toISOString(),
          capturedBy: user?.email?.split('@')[0] || 'Usuário',
          capturedByUserId: user?.id || 'unknown',
          fileSize: Math.round((previewPhoto.length * 3) / 4), // Approximate size
          resolution: { width: img.width, height: img.height },
          tags: customTags ? customTags.split(',').map(tag => tag.trim()) : [],
          uploadStatus: 'pending',
          metadata: {
            device: navigator.platform,
            userAgent: navigator.userAgent,
            orientation: img.width > img.height ? 'landscape' : 'portrait'
          }
        };

        // Save to offline storage
        await photoEvidenceService.savePhoto(photoEvidence);
        
        // Update state
        setPhotos(prev => [...prev, photoEvidence]);
        
        // Schedule upload if online
        if (navigator.onLine) {
          photoEvidenceService.uploadPhoto(photoEvidence.id);
        }

        toast({
          title: "Foto capturada",
          description: "Evidência fotográfica salva com sucesso.",
        });

        setIsDialogOpen(false);
        setPreviewPhoto(null);
        setCurrentCapture(null);
        setDescription('');
        setCustomTags('');
      };
      img.src = previewPhoto;
      
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a foto.",
        variant: "destructive"
      });
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      await photoEvidenceService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      
      toast({
        title: "Foto removida",
        description: "Evidência fotográfica removida com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover a foto.",
        variant: "destructive"
      });
    }
  };

  const retryUpload = async (photoId: string) => {
    try {
      await photoEvidenceService.uploadPhoto(photoId);
      const updatedPhotos = await photoEvidenceService.getPhotosByForm(formId);
      setPhotos(updatedPhotos);
    } catch (error) {
      console.error('Error retrying upload:', error);
    }
  };

  const getPhotosForCategory = (type: 'before' | 'after', category: 'exterior' | 'interior' | 'details') => {
    return photos.filter(p => p.type === type && p.category === category);
  };

  const getFilteredPhotos = () => {
    return photos.filter(photo => {
      if (filterType !== 'all' && photo.type !== filterType) return false;
      if (filterCategory !== 'all' && photo.category !== filterCategory) return false;
      return true;
    });
  };

  const getStatusColor = (status: PhotoEvidence['uploadStatus']) => {
    switch (status) {
      case 'uploaded': return 'bg-green-500';
      case 'uploading': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: PhotoEvidence['uploadStatus']) => {
    switch (status) {
      case 'uploaded': return 'Sincronizada';
      case 'uploading': return 'Enviando';
      case 'error': return 'Erro no envio';
      default: return 'Pendente';
    }
  };

  const PhotoGrid = ({ gridPhotos }: { gridPhotos: PhotoEvidence[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {gridPhotos.map((photo) => (
        <Card key={photo.id} className="relative group overflow-hidden">
          <div className="aspect-square relative">
            <img
              src={photo.thumbnail}
              alt={photo.description}
              className="w-full h-full object-cover"
            />
            
            {/* Status overlay */}
            <div className="absolute top-2 right-2">
              <Badge className={`${getStatusColor(photo.uploadStatus)} text-white text-xs`}>
                {getStatusText(photo.uploadStatus)}
              </Badge>
            </div>

            {/* Type/Category badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                {photo.type === 'before' ? 'Antes' : 'Depois'} - {photo.category}
              </Badge>
            </div>

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(photo.photoDataURL, '_blank')}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {photo.uploadStatus === 'error' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => retryUpload(photo.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deletePhoto(photo.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-3">
            <div className="space-y-1">
              <div className="flex items-center text-xs text-muted-foreground">
                <User className="h-3 w-3 mr-1" />
                {photo.capturedBy}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(photo.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </div>
              {photo.description && (
                <p className="text-xs text-gray-600 truncate">{photo.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const PhotoList = ({ listPhotos }: { listPhotos: PhotoEvidence[] }) => (
    <div className="space-y-3">
      {listPhotos.map((photo) => (
        <Card key={photo.id} className="p-4">
          <div className="flex items-center space-x-4">
            <img
              src={photo.thumbnail}
              alt={photo.description}
              className="w-16 h-16 object-cover rounded-lg"
            />
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {photo.type === 'before' ? 'Antes' : 'Depois'} - {photo.category}
                </Badge>
                <Badge className={`${getStatusColor(photo.uploadStatus)} text-white text-xs`}>
                  {getStatusText(photo.uploadStatus)}
                </Badge>
              </div>
              
              <p className="text-sm font-medium">{photo.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {photo.capturedBy}
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(photo.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
                <div>
                  {photo.resolution.width} x {photo.resolution.height}
                </div>
              </div>
              
              {photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(photo.photoDataURL, '_blank')}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {photo.uploadStatus === 'error' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => retryUpload(photo.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deletePhoto(photo.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const categories = [
    { key: 'exterior', label: 'Exterior', icon: '🚁' },
    { key: 'interior', label: 'Interior', icon: '🪑' },
    { key: 'details', label: 'Detalhes', icon: '🔍' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Capture Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Evidências Fotográficas</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/70">
              {photos.length} foto{photos.length !== 1 ? 's' : ''} capturada{photos.length !== 1 ? 's' : ''}
            </span>
            <Badge variant="outline" className="text-xs">
              Folha: {formCode}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="before" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="before" className="text-white data-[state=active]:bg-white/20">
              Antes da Intervenção
            </TabsTrigger>
            <TabsTrigger value="after" className="text-white data-[state=active]:bg-white/20">
              Depois da Intervenção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => {
                const categoryPhotos = getPhotosForCategory('before', category.key);
                const canAddMore = categoryPhotos.length < maxPhotosPerCategory;
                
                return (
                  <Card key={category.key} className="glass-card border-white/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-sm flex items-center">
                        <span className="mr-2">{category.icon}</span>
                        {category.label}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {categoryPhotos.length}/{maxPhotosPerCategory}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {categoryPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {categoryPhotos.slice(0, 2).map((photo) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.thumbnail}
                                alt={photo.description}
                                className="w-full h-16 object-cover rounded border border-white/30"
                              />
                              <div className="absolute top-1 right-1">
                                <Badge className={`${getStatusColor(photo.uploadStatus)} text-white text-xs`}>
                                  {photo.uploadStatus === 'uploaded' ? '✓' : 
                                   photo.uploadStatus === 'error' ? '✗' : '...'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {canAddMore && (
                        <Button
                          onClick={() => startCapture('before', category.key)}
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/20"
                          size="sm"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capturar Foto
                        </Button>
                      )}
                      
                      {categoryPhotos.length > 2 && (
                        <p className="text-xs text-white/70 text-center">
                          +{categoryPhotos.length - 2} foto{categoryPhotos.length - 2 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="after" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => {
                const categoryPhotos = getPhotosForCategory('after', category.key);
                const canAddMore = categoryPhotos.length < maxPhotosPerCategory;
                
                return (
                  <Card key={category.key} className="glass-card border-white/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-sm flex items-center">
                        <span className="mr-2">{category.icon}</span>
                        {category.label}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {categoryPhotos.length}/{maxPhotosPerCategory}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {categoryPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {categoryPhotos.slice(0, 2).map((photo) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.thumbnail}
                                alt={photo.description}
                                className="w-full h-16 object-cover rounded border border-white/30"
                              />
                              <div className="absolute top-1 right-1">
                                <Badge className={`${getStatusColor(photo.uploadStatus)} text-white text-xs`}>
                                  {photo.uploadStatus === 'uploaded' ? '✓' : 
                                   photo.uploadStatus === 'error' ? '✗' : '...'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {canAddMore && (
                        <Button
                          onClick={() => startCapture('after', category.key)}
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/20"
                          size="sm"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capturar Foto
                        </Button>
                      )}
                      
                      {categoryPhotos.length > 2 && (
                        <p className="text-xs text-white/70 text-center">
                          +{categoryPhotos.length - 2} foto{categoryPhotos.length - 2 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Galeria de Evidências</CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="before">Antes</SelectItem>
                    <SelectItem value="after">Depois</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="exterior">Exterior</SelectItem>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="details">Detalhes</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'grid' ? (
              <PhotoGrid gridPhotos={getFilteredPhotos()} />
            ) : (
              <PhotoList listPhotos={getFilteredPhotos()} />
            )}
            
            {getFilteredPhotos().length === 0 && (
              <div className="text-center py-8 text-white/70">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma foto encontrada com os filtros selecionados</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Capture Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-aviation-gray-800 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Capturar Evidência Fotográfica
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {currentCapture && (
                <>
                  {currentCapture.type === 'before' ? 'Antes' : 'Depois'} da intervenção - {' '}
                  {currentCapture.category === 'exterior' ? 'Exterior' :
                   currentCapture.category === 'interior' ? 'Interior' : 'Detalhes'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!captureMode && !previewPhoto && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setCaptureMode('camera');
                    startCamera();
                  }}
                  className="mobile-button h-20 flex-col"
                >
                  <Camera className="h-8 w-8 mb-2" />
                  Usar Câmera
                </Button>

                <Button
                  onClick={() => {
                    setCaptureMode('upload');
                    fileInputRef.current?.click();
                  }}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/20 h-20 flex-col"
                >
                  <Upload className="h-8 w-8 mb-2" />
                  Escolher Arquivo
                </Button>
              </div>
            )}

            {isCamera && captureMode === 'camera' && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button 
                      onClick={capturePhoto} 
                      className="mobile-button"
                      size="lg"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
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
                    className="w-full h-80 object-cover rounded-lg border border-white/30"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Descrição (opcional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva o que está sendo documentado..."
                      className="mobile-input"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Tags personalizadas (opcional)</Label>
                    <Input
                      value={customTags}
                      onChange={(e) => setCustomTags(e.target.value)}
                      placeholder="Separar por vírgulas: limpeza, motor, fuselagem..."
                      className="mobile-input"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={savePhoto} className="mobile-button flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Salvar Evidência
                  </Button>
                  <Button 
                    onClick={() => {
                      setPreviewPhoto(null);
                      setCaptureMode(null);
                      setDescription('');
                      setCustomTags('');
                    }}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    Tentar Novamente
                  </Button>
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
    </div>
  );
}
