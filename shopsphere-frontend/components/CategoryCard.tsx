import Image from "next/image";
import { getCategoryImage } from "@/lib/images";

type Category = {
  id: number;
  name: string;
};

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="border rounded p-3 text-center focus-within:ring">
      <Image
        src={getCategoryImage(category.id)}
        alt={`${category.name} category`}
        width={200}
        height={200}
        className="rounded object-cover mx-auto h-40 w-full"
      />
      <p className="mt-2 font-medium">{category.name}</p>
    </div>
  );
}
