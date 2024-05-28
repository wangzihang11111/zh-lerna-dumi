import {
  FileExcelFilled,
  FileImageFilled,
  FilePdfFilled,
  FileTextFilled,
  FileWordFilled,
  FileZipFilled
} from '@ant-design/icons';
import { useMemo } from 'react';
import { getFileType } from '../util';

export function FileView(props) {
  const { isPreview, fileName, fileIconStyle, onClick = () => {} } = props;
  const blueFile = { ...fileIconStyle, color: '#53B7F4' };
  const fileIconMap = useMemo(
    () => ({
      doc: <FileWordFilled style={blueFile} />,
      docx: <FileWordFilled style={blueFile} />,
      xls: <FileExcelFilled style={{ ...fileIconStyle, color: '#53D39C' }} />,
      xlsx: <FileExcelFilled style={{ ...fileIconStyle, color: '#53D39C' }} />,
      pdf: <FilePdfFilled style={{ ...fileIconStyle, color: '#FF7878' }} />,
      zip: <FileZipFilled style={{ ...fileIconStyle, color: '#FF7878' }} />,
      png: <FileImageFilled style={blueFile} />,
      jpg: <FileImageFilled style={blueFile} />,
      jpeg: <FileImageFilled style={blueFile} />,
      gif: <FileImageFilled style={blueFile} />
    }),
    [fileIconStyle]
  );
  const fileType = useMemo(() => getFileType(fileName), [fileName]);
  return (
    <>
      <span style={{ marginRight: 10 }}>{fileIconMap[fileType] ?? <FileTextFilled style={fileIconStyle} />}</span>
      <span
        title={fileName}
        className={`attachment-overflow ${isPreview ? 'attachment-preview-file' : ''}`}
        onClick={isPreview ? onClick : null}
      >
        {fileName}
      </span>
    </>
  );
}
