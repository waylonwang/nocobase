import { isArrayField } from '@formily/core';
import { observer, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Tag } from 'antd';
import React from 'react';
import { useCompile } from '../../hooks';
import { defaultFieldNames, getCurrentOptions } from './shared';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';

type Composed = {
  Select?: React.FC<any>;
  Object?: React.FC<any>;
};

export const ReadPretty = observer((props: any) => {
  const fieldNames = { ...defaultFieldNames, ...props.fieldNames };
  const field = useField<any>();
  const compile = useCompile();

  if (!isValid(props.value)) {
    return <div />;
  }
  if (isArrayField(field) && field?.value?.length === 0) {
    return <div />;
  }
  const dataSource = field.dataSource || props.options || [];
  const options = getCurrentOptions(field.value, dataSource, fieldNames);

  return (
    <div>
      <EllipsisWithTooltip ellipsis={props.ellipsis}>
        {options.map((option, key) => (
          <Tag key={key} color={option[fieldNames.color]} icon={option.icon}>
            {compile(option[fieldNames.label])}
          </Tag>
        ))}
      </EllipsisWithTooltip>
    </div>
  );
});
