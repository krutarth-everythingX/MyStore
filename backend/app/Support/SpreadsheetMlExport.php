<?php

namespace App\Support;

class SpreadsheetMlExport
{
    public static function build(array $headings, array $rows, string $worksheetName = 'Export'): string
    {
        $worksheetName = self::escape((string) $worksheetName);
        $xml = [
            '<?xml version="1.0"?>',
            '<?mso-application progid="Excel.Sheet"?>',
            '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
            ' xmlns:o="urn:schemas-microsoft-com:office:office"',
            ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
            ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"',
            ' xmlns:html="http://www.w3.org/TR/REC-html40">',
            ' <Styles>',
            '  <Style ss:ID="Header">',
            '   <Font ss:Bold="1"/>',
            '   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>',
            '  </Style>',
            ' </Styles>',
            ' <Worksheet ss:Name="' . $worksheetName . '">',
            '  <Table>',
            self::buildRow($headings, true),
        ];

        foreach ($rows as $row) {
            $xml[] = self::buildRow($row);
        }

        $xml[] = '  </Table>';
        $xml[] = ' </Worksheet>';
        $xml[] = '</Workbook>';

        return implode('', $xml);
    }

    private static function buildRow(array $cells, bool $isHeader = false): string
    {
        $row = '<Row>';

        foreach ($cells as $cell) {
            $type = self::cellType($cell);
            $value = self::escape(self::normalize($cell));
            $style = $isHeader ? ' ss:StyleID="Header"' : '';
            $row .= '<Cell' . $style . '><Data ss:Type="' . $type . '">' . $value . '</Data></Cell>';
        }

        return $row . '</Row>';
    }

    private static function cellType(mixed $value): string
    {
        return is_int($value) || is_float($value) ? 'Number' : 'String';
    }

    private static function normalize(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return (string) $value;
    }

    private static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
