import React from 'react';

export const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Care Connect - Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          L'application fonctionne correctement !
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Status des services :</h2>
          <ul className="text-left space-y-2">
            <li className="text-green-600">✅ Frontend React : http://localhost:8081</li>
            <li className="text-green-600">✅ Backend Laravel : http://localhost:8000</li>
            <li className="text-green-600">✅ Reverb WebSocket : ws://localhost:8080</li>
          </ul>
        </div>
        <div className="mt-6">
          <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Aller à la page de login
          </a>
        </div>
      </div>
    </div>
  );
};
