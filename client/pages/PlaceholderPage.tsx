import { ArrowLeft, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-aviation-gradient">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="glass-card border-white/20">
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <div className="h-24 w-24 bg-aviation-blue-600/30 rounded-full mx-auto flex items-center justify-center mb-4">
                <Icon className="h-12 w-12 text-aviation-blue-300" />
              </div>
              <Construction className="h-8 w-8 text-white/60 mx-auto mb-4" />
            </div>
            
            <CardTitle className="text-3xl font-bold text-white mb-4">
              {title}
            </CardTitle>
            
            <CardDescription className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              {description}
            </CardDescription>
            
            <div className="space-y-4">
              <p className="text-white/60">
                Esta página está sendo desenvolvida. Continue interagindo com o assistente 
                para implementar esta funcionalidade.
              </p>
              
              <div className="flex justify-center space-x-4">
                <Link to="/">
                  <Button className="aviation-button">
                    Voltar ao Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
