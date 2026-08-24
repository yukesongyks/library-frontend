import React from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd';

/**
 * TextIconButton - 文字图标按钮组件
 * 统一项目中带图标的文字按钮样式
 */
type TextIconButtonProps = ButtonProps & {
  icon: React.ReactNode;
  children: React.ReactNode;
};

function TextIconButton({ icon, children, ...restProps }: TextIconButtonProps) {
  return (
    <Button type="text" icon={icon} {...restProps}>
      {children}
    </Button>
  );
}

export default TextIconButton;
