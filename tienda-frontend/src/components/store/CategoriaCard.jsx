// src/components/store/CategoriaCard.jsx

export const CategoriaCard = ({ categoria, isActive, onClick }) => {
    
    // TRUCO TEMPORAL: Mientras agregamos el campo "icono" al backend, 
    // le asignamos uno automáticamente según el nombre.
    const getIconoTemporal = (nombre) => {
        const nom = nombre.toLowerCase();
        if (nom.includes('perfum')) return 'fragrance';
        if (nom.includes('limpieza')) return 'sanitizer';
        if (nom.includes('cuidado') || nom.includes('personal')) return 'face_5';
        if (nom.includes('hogar')) return 'home_repair_service';
        return 'category'; // Ícono por defecto
    };

    // Usamos el icono que venga del backend, o el temporal
    const icono = categoria.icono || getIconoTemporal(categoria.nombre);

    return (
        <button 
            onClick={() => onClick(categoria)}
            className={`flex shrink-0 items-center gap-2.5 rounded-full border-2 px-4 py-2.5 transition-all duration-200 active:scale-95 ${
                isActive 
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'border-slate-200 bg-white text-slate-700 hover:border-primary/30 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
        >
            <span className={`material-symbols-outlined text-[20px] transition-colors ${
                isActive ? 'text-white' : 'text-primary'
            }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >{icono}</span>
            <span className="text-sm font-bold whitespace-nowrap">{categoria.nombre}</span>
        </button>
    );
};