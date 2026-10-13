import { useState } from "react";
import { onImageError } from "../../../lib/images";

export function ProductGallery({ images, name }) {
  const [selected, setSelected] = useState(0);
  const list = [...new Set(images.filter(Boolean))];
  return (
    <div>
      <div className="card aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img onError={onImageError} src={list[selected]} alt={name} width="600" height="600" className="h-full w-full object-cover" />
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2" role="group" aria-label="Product images">
          {list.map((src, index) => (
            <button
              key={src}
              onClick={() => setSelected(index)}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === selected}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 sm:h-20 sm:w-20 ${index === selected ? "border-indigo-600" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <img onError={onImageError} src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
