import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/api/axios';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = React.useState('');

    const onSubmit = async (data: any) => {
        try {
            const formData = new FormData();
            formData.append('username', data.emp_id); // Backend expects username
            formData.append('password', data.password);

            const response = await api.post('/login/access-token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // OAuth2 expects form data
            });

            await login(response.data.access_token);
            navigate('/');
        } catch (err: any) {
            setError('Invalid credentials or inactive account');
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-8 shadow-sm">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Agency CMS</h1>
                    <p className="mt-2 text-sm text-gray-600">Enter your Employee ID to sign in</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Employee ID
                            </label>
                            <Input
                                {...register('emp_id', { required: true })}
                                placeholder="e.g. 10001"
                                className="mt-2"
                            />
                            {errors.emp_id && <span className="text-sm text-red-500">Required</span>}
                        </div>
                        <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Password
                            </label>
                            <Input
                                type="password"
                                {...register('password', { required: true })}
                                className="mt-2"
                            />
                            {errors.password && <span className="text-sm text-red-500">Required</span>}
                        </div>
                    </div>

                    {error && <div className="text-sm text-red-500">{error}</div>}

                    <Button type="submit" className="w-full">
                        Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Login;
