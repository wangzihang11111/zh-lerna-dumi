import { Button } from '../../../../functionalComponent';

export const AttachmentButton = (props) => {
  const { permissionStatus, disabled, ...restProps } = props;
  return +permissionStatus === 2 ? null : (
    <Button className="attachment-button" {...restProps} disabled={disabled || +permissionStatus === 0} />
  );
};
