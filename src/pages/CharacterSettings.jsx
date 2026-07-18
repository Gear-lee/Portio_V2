import React, { useState } from 'react';

// Sub-komponen untuk tiap Karakter agar input pose tidak saling bertabrakan
const CharacterItem = ({ char, onAddPose }) => {
  const [poseName, setPoseName] = useState('');
  const [poseUrl, setPoseUrl] = useState('');

  const handleAdd = () => {
    if (!poseName.trim() || !poseUrl.trim()) return;
    onAddPose(char.id, poseName.trim(), poseUrl.trim());
    setPoseName('');
    setPoseUrl('');
  };

  return (
    <div className="border p-4 rounded shadow-sm bg-white mb-4">
      <h3 className="font-bold text-lg mb-3 text-gray-800">{char.name}</h3>
      
      {/* Input Pose */}
      <div className="flex gap-2 mb-3">
        <input 
          placeholder="Pose (e.g. Happy)" 
          className="border p-2 w-1/3 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
          value={poseName} 
          onChange={(e) => setPoseName(e.target.value)} 
        />
        <input 
          placeholder="Image URL" 
          className="border p-2 flex-grow rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
          value={poseUrl} 
          onChange={(e) => setPoseUrl(e.target.value)} 
        />
        <button 
          onClick={handleAdd} 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold transition"
        >
          +
        </button>
      </div>

      {/* Preview List */}
      <div className="flex flex-wrap gap-3 mt-2">
        {char.poses.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Belum ada pose/ekspresi.</p>
        ) : (
          char.poses.map((pose, idx) => (
            <div key={idx} className="border p-2 text-xs rounded bg-gray-50 text-center w-20 shadow-sm">
              <img 
                src={pose.url} 
                alt={pose.name} 
                className="w-16 h-16 object-cover rounded mb-1 mx-auto bg-gray-200" 
                onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=Error'; }}
              />
              <p className="truncate font-medium text-gray-700">{pose.name}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CharacterSettings = () => {
  const [characters, setCharacters] = useState([]);
  const [name, setName] = useState('');

  const addCharacter = () => {
    if (!name.trim()) return;
    setCharacters([...characters, { id: Date.now(), name: name.trim(), poses: [] }]);
    setName('');
  };

  const addPose = (charId, poseName, poseUrl) => {
    setCharacters(characters.map(char => {
      if (char.id === charId) {
        return { ...char, poses: [...char.poses, { name: poseName, url: poseUrl }] };
      }
      return char;
    }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Character Settings</h2>
      
      {/* Form Tambah Karakter */}
      <div className="mb-8 flex gap-2 bg-white p-4 rounded shadow-sm">
        <input 
          className="border p-2 flex-grow rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Nama Karakter Baru (e.g. Alice)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button 
          onClick={addCharacter} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold transition"
        >
          Add Character
        </button>
      </div>

      {/* List Karakter */}
      <div className="space-y-2">
        {characters.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-white rounded shadow-sm italic">
            Belum ada karakter. Tambahkan karakter pertama Anda di atas!
          </p>
        ) : (
          characters.map(char => (
            <CharacterItem key={char.id} char={char} onAddPose={addPose} />
          ))
        )}
      </div>
    </div>
  );
};

export default CharacterSettings;
