import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline';
  border?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  showStatus = false,
  status = 'offline',
  border = false,
}) => {
  // 獲取名稱的第一個字符（支持中文和英文）
  const getInitial = (name: string): string => {
    if (!name) return '?';
    // 處理中文：取第一個字符
    // 處理英文：取第一個字母並轉大寫
    const firstChar = name.trim().charAt(0);
    // 如果是英文字母，轉為大寫
    if (/[a-zA-Z]/.test(firstChar)) {
      return firstChar.toUpperCase();
    }
    return firstChar;
  };

  const initial = getInitial(name);

  // 尺寸映射
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const sizeClass = sizeClasses[size];

  // 生成背景顏色（基於名稱）
  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const bgColor = getBackgroundColor(name);

  const [imageError, setImageError] = React.useState(false);
  
  // 當 src 改變時重置錯誤狀態
  React.useEffect(() => {
    setImageError(false);
  }, [src]);
  
  // 如果沒有 src 或圖片載入失敗，顯示預設頭像
  const showFallback = !src || imageError;

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {!showFallback ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ${border ? 'border-2 border-primary' : ''}`}
          onError={() => {
            setImageError(true);
          }}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full ${bgColor} text-white font-bold flex items-center justify-center ${
            border ? 'border-2 border-primary' : ''
          }`}
        >
          {initial}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 ${
            status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          } border-2 border-white dark:border-gray-900 rounded-full`}
        />
      )}
    </div>
  );
};

export default Avatar;

