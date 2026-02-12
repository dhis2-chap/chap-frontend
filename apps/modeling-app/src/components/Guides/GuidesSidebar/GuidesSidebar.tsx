import { NavLink } from 'react-router-dom';
import { getCategories, getGuidesByCategory, getRootGuides } from '@docs/index';
import styles from './GuidesSidebar.module.css';

export const GuidesSidebar = () => {
    const rootGuides = getRootGuides();
    const categories = getCategories();

    return (
        <nav className={styles.sidebar}>
            {rootGuides.length > 0 && (
                <ul className={styles.rootGuideList}>
                    {rootGuides.map(guide => (
                        <li key={guide.slug} className={styles.guideItem}>
                            <NavLink
                                to={`/guides/${guide.slug}`}
                                className={({ isActive }) =>
                                    `${styles.guideLink} ${isActive ? styles.active : ''}`}
                            >
                                {guide.title}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            )}
            {categories.map(category => (
                <div key={category} className={styles.category}>
                    <div className={styles.categoryTitle}>{category}</div>
                    <ul className={styles.guideList}>
                        {getGuidesByCategory(category).map(guide => (
                            <li key={guide.slug} className={styles.guideItem}>
                                <NavLink
                                    to={`/guides/${guide.slug}`}
                                    className={({ isActive }) =>
                                        `${styles.guideLink} ${isActive ? styles.active : ''}`}
                                >
                                    {guide.title}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
};
