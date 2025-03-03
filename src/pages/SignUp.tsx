import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useNotifications } from '../context/NotificationContext';

const signUpSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  confirmPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const { signUp } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      await signUp(data.email, data.password);
      addNotification({
        title: 'Compte cree',
        message: 'Votre compte a ete cree avec succes. Veuillez vous connecter.',
        type: 'success',
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1C1C25] text-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Dumbbell className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-2xl font-semibold">Creer un Compte</h1>
          <p className="text-gray-400 text-sm">
            Rejoignez Gym Manager pour commencer a gerer votre entreprise de fitness
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="E-mail"
                      className="bg-[#24242C] border-[#34343E] h-12 px-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe"
                        className="bg-[#24242C] border-[#34343E] h-12 px-4 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmer le mot de passe"
                        className="bg-[#24242C] border-[#34343E] h-12 px-4 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Creation du compte...' : 'Creer un Compte'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1C1C25] text-gray-400">Ou inscrivez-vous avec</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="bg-[#24242C] border-[#34343E] hover:bg-[#2A2A32] text-white"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-[#24242C] border-[#34343E] hover:bg-[#2A2A32] text-white"
              >
                <img
                  src="https://www.apple.com/favicon.ico"
                  alt="Apple"
                  className="w-5 h-5 mr-2"
                />
                Apple
              </Button>
            </div>

            <p className="text-center text-gray-400 text-sm">
              Vous avez deja un compte?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-400">
                Se connecter
              </Link>
            </p>
          </form>
        </Form>

        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-300">Politique de Confidentialite</a>
            <a href="#" className="hover:text-gray-300">Conditions d'Utilisation</a>
          </div>
          <p className="text-xs text-gray-500">
            © 2025 Gym Manager Inc. Tous droits reserves.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;