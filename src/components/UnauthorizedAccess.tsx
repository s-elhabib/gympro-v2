import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

const UnauthorizedAccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès Non Autorisé</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page. 
        Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          Aller au Tableau de Bord
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;
