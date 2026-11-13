import React, { forwardRef, HTMLAttributes, ReactNode, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { IOptionsProps } from '../Option';
import SearchableSelect, { SearchableOption } from '../../SearchableSelect';
import Validation from './Validation';

interface ISelectProps extends Partial<IOptionsProps>, Omit<HTMLAttributes<HTMLSelectElement>, 'defaultValue' | 'onChange'> {
    id?: string;
    className?: string;
    name?: string;
    children?: ReactNode;
    ariaLabel: string;
    placeholder?: string;
    size?: 'lg' | 'sm';
    multiple?: boolean;
    disabled?: boolean;
    required?: boolean;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
    title?: string;
    value?: string | string[];
    defaultValue?: string | string[];
    isTouched?: boolean;
    isValid?: boolean;
    invalidFeedback?: string;
    validFeedback?: string;
    isValidMessage?: boolean;
    isTooltipFeedback?: boolean;
    onBlur?(...args: any[]): unknown;
    onChange?(...args: any[]): unknown;
    onFocus?(...args: any[]): unknown;
    onInput?(...args: any[]): unknown;
    onInvalid?(...args: any[]): unknown;
    onSelect?(...args: any[]): unknown;
}

const textOf = (node: ReactNode): string => React.Children.toArray(node).map(child => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    return React.isValidElement(child) ? textOf((child.props as any).children) : '';
}).join('');

function optionsFrom(children: ReactNode, list?: IOptionsProps['list']) {
    if (list) return list.map(item => ({ value: item.value ?? '', label: String(item.text ?? item.label ?? item.value ?? '') }));
    const result: SearchableOption[] = [];
    const visit = (nodes: ReactNode) => React.Children.forEach(nodes, child => {
        if (!React.isValidElement(child)) return;
        if (child.type === React.Fragment) { visit((child.props as any).children); return; }
        const props = child.props as any;
        const label = textOf(props.children);
        result.push({ value: props.value ?? label, label, disabled: props.disabled });
    });
    visit(children);
    return result;
}

/** Backwards-compatible adapter that upgrades legacy form selects to the shared searchable combobox. */
const Select = forwardRef<HTMLSelectElement, ISelectProps>(({
    id, name, className, children, required, placeholder, ariaLabel, list, multiple = false, size, disabled = false,
    value, defaultValue, isValid, isTouched, invalidFeedback, validFeedback, isValidMessage = true,
    isTooltipFeedback, onBlur, onChange,
}, _ref) => {
    const options = useMemo(() => optionsFrom(children, list), [children, list]);
    const empty = options.find(option => String(option.value) === '');
    const choices = options.filter(option => String(option.value) !== '');
    const [internal, setInternal] = useState<string | string[]>(defaultValue ?? (multiple ? [] : ''));
    const current = value === undefined ? internal : value;
    const change = (next: string | string[]) => {
        if (value === undefined) setInternal(next);
        const target = { id, name: name || id, value: next, type: multiple ? 'select-multiple' : 'select-one' };
        onChange?.({ target, currentTarget: target, persist: () => undefined });
    };
    return <>
        <SearchableSelect id={id} name={name} ariaLabel={ariaLabel} value={current} options={choices} onChange={change}
            multiple={multiple} required={required} disabled={disabled} placeholder={placeholder || empty?.label || 'Select an option'}
            className={classNames('legacy-searchable-select',{[`sukun-select-${size}`]:size,'is-invalid':!isValid&&isTouched&&invalidFeedback,'is-valid':isValid&&isTouched},className)}
            onBlur={()=>{const target={id,name:name||id,value:current,type:multiple?'select-multiple':'select-one'};onBlur?.({target,currentTarget:target,persist:()=>undefined});}} />
        {isValidMessage&&<Validation isTouched={isTouched} invalidFeedback={invalidFeedback} validFeedback={validFeedback} isTooltip={isTooltipFeedback}/>}
    </>;
});
Select.displayName = 'Select';
Select.propTypes = {
    id: PropTypes.string, className: PropTypes.string, name: PropTypes.string,
    // @ts-ignore React's broad node type and the runtime validator differ on bigint.
    children: PropTypes.node,
    ariaLabel: PropTypes.string.isRequired, placeholder: PropTypes.string, size: PropTypes.oneOf(['lg','sm']),
    multiple: PropTypes.bool, disabled: PropTypes.bool, required: PropTypes.bool, value: PropTypes.any,
    defaultValue: PropTypes.any, list: PropTypes.array, isTouched: PropTypes.bool, isValid: PropTypes.bool,
    invalidFeedback: PropTypes.string, validFeedback: PropTypes.string, isValidMessage: PropTypes.bool,
    isTooltipFeedback: PropTypes.bool, onBlur: PropTypes.func, onChange: PropTypes.func,
};

export default Select;
