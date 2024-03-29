import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
}

type AuthContextData = {
    user: User | null;
    signInUrl: string;
    signOut: () => void;
}

type AuthResponse = {
    token: string;
    user: User;
}

export const AuthContext = createContext({} as AuthContextData)

type AuthProvider = {
    children: ReactNode;
}

export function AuthProvider(props: AuthProvider) {
    const [user, setUser] = useState<User | null>(null)

    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=06244e4222c7a78d5d3e`

    async function signIn(code: String) {
        const response = await api.post<AuthResponse>("authenticate", {
            code: code
        })

        const { token, user } = response.data;

        localStorage.setItem('@dowhile:token', token);

        api.defaults.headers.common.authorization = `Bearer ${token}`

        setUser(user)
    }

    function signOut() {
        setUser(null);
        localStorage.removeItem('@dowhile:token')
    }

    useEffect(() => {
        const token = localStorage.getItem('@dowhile:token')

        if (token) {

            api.defaults.headers.common.authorization = `Bearer ${token}`

            api.get<User>('profile').then(response => {
                setUser(response.data)
            })
        }
    }, [])

    useEffect(() => {
        const url = window.location.href;
        const hasGitHubCode = url.includes('?code=');

        if (hasGitHubCode) {
            const [urlWithoutCode, gitHubCode] = url.split('?code=')

            window.history.pushState({}, '', urlWithoutCode)
            signIn(gitHubCode)
        }

    }, [])

    return (
        <AuthContext.Provider value={{ signInUrl, user, signOut }}>
            {props.children}
        </AuthContext.Provider>
    );
}