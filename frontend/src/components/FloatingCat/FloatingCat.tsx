import Image from 'next/image';
import catImage from '../../img/cat.png';
import './FloatingCat.css';

export const FloatingCat = () => {
  return (
    <div className="floating-cat">
      <Image src={catImage} alt="Cat" unoptimized />
    </div>
  );
};
