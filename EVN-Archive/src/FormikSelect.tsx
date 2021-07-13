// react-select wrapper for use inside formik forms
// Based on: https://gist.github.com/hubgit/e394e9be07d95cd5e774989178139ae8
//
import { FieldProps } from "formik";
import React from "react";
import CreatableSelect from "react-select/creatable";
import { OptionsType, ValueType } from "react-select";

export interface Option {
  label: string;
  value: string;
}

interface FormikSelectProps extends FieldProps {
  options: OptionsType<Option>;
  isCreatable?: boolean;
  isMulti?: boolean;
  className?: string;
  placeholder?: string;
}

export const FormikSelect = ({
  className,
  placeholder,
  field,
  form,
  options,
  isCreatable = false,
  isMulti = false,
}: FormikSelectProps) => {
  //const onChange = (option: ValueType<Option | Option[]>) => {
  const onChange = (option: ValueType<Option | Option[], boolean>) => {
    form.setFieldValue(
      field.name,
      isMulti
        ? (option as Option[]).map((item: Option) => item.value)
        : (option as Option).value
    );
  };

  const getValue = () => {
    if (options) {
      return isMulti
        ? options.filter(option => field.value.indexOf(option.value) >= 0)
        : options.find(option => option.value === field.value);
    } else {
      return isMulti ? [] : ("" as any);
    }
  };

  return (
    <CreatableSelect
      className = {className}
      placeholder = {placeholder}
      name = {field.name}
      value = {getValue()}
      isValidNewOption={() => isCreatable}
      onChange = {onChange}
      options = {options}
      isMulti = {isMulti}
      menuPortalTarget = {document.body} 
      menuPosition = {'fixed'}
    />
  );
};
