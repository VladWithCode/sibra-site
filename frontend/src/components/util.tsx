export function MDash({ Wrapper }: { Wrapper?: React.FC<any> }) {
    if (Wrapper !== undefined) {
        return <Wrapper children={<>&mdash;</>} />
    }
    return <>&mdash;</>;
}
