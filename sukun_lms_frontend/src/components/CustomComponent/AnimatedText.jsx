import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const AnimatedText = ({ text, className, delay = 0 }) => {
    const words = text.split(" ");
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.04 * i,
                delay: delay
            },
        }),
    };
 const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <motion.div
            key={text}
            className={className}
            variants={container}
            initial="hidden"
            animate="visible"
        >
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    variants={child}
                    style={{ marginRight: "5px" }}
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
};

AnimatedText.propTypes = {
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
    delay: PropTypes.number,
};

export default AnimatedText;