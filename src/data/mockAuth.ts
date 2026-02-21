import { mockUsers } from '@/data/mockData';
import { User } from '@/api/auth';

// Simulate async delay
const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

export const mockAuthApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    await delay(600);
    const found = mockUsers.find((u) => u.email === email && u.password === password);
    if (!found) throw { response: { data: { message: 'Email ou mot de passe incorrect' } } };
    const { password: _, ...user } = found;
    return { token: `mock-token-${user.id}`, user };
  },

  register: async (data: { first_name: string; last_name: string; email: string; password: string }): Promise<{ token: string; user: User }> => {
    await delay(600);
    if (mockUsers.find((u) => u.email === data.email)) {
      throw { response: { data: { message: 'Cet email est déjà utilisé' } } };
    }
    const newUser: User = {
      id: mockUsers.length + 10,
      email: data.email,
      role: 'patient',
      first_name: data.first_name,
      last_name: data.last_name,
    };
    return { token: `mock-token-${newUser.id}`, user: newUser };
  },

  logout: async () => {
    await delay(200);
  },
};
